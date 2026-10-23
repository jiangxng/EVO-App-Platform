-- PA05 E01J4F test-only DBA-owned SQL function for pending recovery.
-- Production DBA provisioning, credentials and operator confirmation UNPROVEN.
-- __PA05_SCHEMA__ replaced with validated disposable test schema.
CREATE FUNCTION "__PA05_SCHEMA__".pa05_read_lifecycle_operator_pending(p_host_id text)
RETURNS TABLE(operation_id text, operation text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $pa05_j4f$
DECLARE v_host text; v_approved bigint;
BEGIN
  SELECT op.host_id INTO v_host
    FROM "__PA05_SCHEMA__".pa05_read_lifecycle_operators op
    WHERE op.login_role=session_user
      AND op.host_id=p_host_id AND op.enabled=true FOR SHARE;
  IF v_host IS NULL THEN
    RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_OPERATOR_NOT_TRUSTED'
      USING ERRCODE='42501';
  END IF;
  SELECT approved_epoch INTO v_approved
    FROM "__PA05_SCHEMA__".pa05_read_host_activation_epoch a
    WHERE a.owner_package_id='evo-purchase-attention'
      AND a.host_id=v_host FOR SHARE;
  IF v_approved IS DISTINCT FROM 0 THEN
    RAISE EXCEPTION 'PA05_READ_LIFECYCLE_SQL_NOT_FENCED'
      USING ERRCODE='42501';
  END IF;
  -- Return at most two to make ambiguous concurrent intentions fail closed.
  -- Not a general listing API: only the authenticated Host's FENCED rows.
  RETURN QUERY SELECT i.operation_id,i.operation
    FROM "__PA05_SCHEMA__".pa05_read_lifecycle_intents i
    WHERE i.owner_package_id='evo-purchase-attention'
      AND i.host_id=v_host AND i.state='FENCED'
    ORDER BY i.operation_id LIMIT 2;
END
$pa05_j4f$;
