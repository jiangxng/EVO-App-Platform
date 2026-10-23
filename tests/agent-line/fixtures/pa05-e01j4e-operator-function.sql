-- PA05 E01J4E: DBA-owned least-privilege operator contract (test fixture).
-- __PA05_SCHEMA__ is replaced with a strictly validated disposable schema.
-- This is NOT automatically installed by the Host; production DBA provisioning
-- and credential issuance remain separate unsigned gates.
CREATE FUNCTION "__PA05_SCHEMA__".pa05_read_lifecycle_operator_transition(
  p_phase text, p_operation_id text, p_operation text, p_host_id text
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp
AS $pa05_e01j4e$
DECLARE
  v_host text;
  v_epoch bigint;
  v_approved bigint;
  v_state text;
  v_operation text;
BEGIN
  IF p_operation NOT IN ('DISABLE','UNINSTALL')
      OR p_operation_id IS NULL OR length(p_operation_id)<8
      OR p_host_id IS NULL THEN
    RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_INVALID_ARGUMENT'
      USING ERRCODE='42501';
  END IF;
  SELECT host_id INTO v_host
    FROM "__PA05_SCHEMA__".pa05_read_lifecycle_operators
    WHERE login_role=session_user AND host_id=p_host_id AND enabled=true
    FOR SHARE;
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_OPERATOR_NOT_TRUSTED'
      USING ERRCODE='42501';
  END IF;
  IF p_phase='FENCE' THEN
    SELECT epoch INTO v_epoch
      FROM "__PA05_SCHEMA__".pa05_read_owner_epoch
      WHERE owner_package_id='evo-purchase-attention'
      FOR SHARE;
    IF v_epoch IS NULL THEN
      RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_NO_OWNER'
        USING ERRCODE='42501';
    END IF;
    SELECT approved_epoch INTO v_approved
      FROM "__PA05_SCHEMA__".pa05_read_host_activation_epoch
      WHERE owner_package_id='evo-purchase-attention' AND host_id=v_host
      FOR UPDATE;
    IF v_approved IS DISTINCT FROM v_epoch THEN
      RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_REATTEST_REQUIRED'
        USING ERRCODE='42501';
    END IF;
    INSERT INTO "__PA05_SCHEMA__".pa05_read_lifecycle_intents(
      operation_id,host_id,owner_package_id,expected_epoch,state,operation
    ) VALUES(p_operation_id,v_host,'evo-purchase-attention',
      v_epoch,'FENCED',p_operation);
    UPDATE "__PA05_SCHEMA__".pa05_read_host_activation_epoch
      SET approved_epoch=0
      WHERE owner_package_id='evo-purchase-attention'
        AND host_id=v_host AND approved_epoch=v_epoch;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_CUT_RACE'
        USING ERRCODE='42501';
    END IF;
  ELSIF p_phase IN ('ASSERT','COMPLETE') THEN
    SELECT state,operation INTO v_state,v_operation
      FROM "__PA05_SCHEMA__".pa05_read_lifecycle_intents
      WHERE operation_id=p_operation_id AND host_id=v_host
        AND owner_package_id='evo-purchase-attention'
      FOR UPDATE;
    IF v_state IS NULL OR v_operation IS DISTINCT FROM p_operation
      OR v_state NOT IN ('FENCED','COMPLETE') THEN
      RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_INTENT_MISMATCH'
        USING ERRCODE='42501';
    END IF;
    SELECT approved_epoch INTO v_approved
      FROM "__PA05_SCHEMA__".pa05_read_host_activation_epoch
      WHERE owner_package_id='evo-purchase-attention' AND host_id=v_host
      FOR SHARE;
    IF v_approved IS DISTINCT FROM 0 THEN
      RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_NOT_FENCED'
        USING ERRCODE='42501';
    END IF;
    IF p_phase='COMPLETE' AND v_state='FENCED' THEN
      UPDATE "__PA05_SCHEMA__".pa05_read_lifecycle_intents
        SET state='COMPLETE'
        WHERE operation_id=p_operation_id AND host_id=v_host
          AND owner_package_id='evo-purchase-attention'
          AND operation=p_operation AND state='FENCED';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_COMPLETE_RACE'
          USING ERRCODE='42501';
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_PHASE_INVALID'
      USING ERRCODE='42501';
  END IF;
  RETURN v_host;
END
$pa05_e01j4e$;
