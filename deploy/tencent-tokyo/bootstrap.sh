#!/usr/bin/env bash
set -euo pipefail

# One-time Ubuntu 24.04 initialization. Run only after reviewing this script.
# Set EVO_DEPLOY_REF to an exact 40-character merged Git commit SHA.
if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root with sudo." >&2
  exit 1
fi
ref="${EVO_DEPLOY_REF:-}"
if [[ ! "$ref" =~ ^[0-9a-f]{40}$ ]]; then
  echo "EVO_DEPLOY_REF must be a full immutable Git commit SHA; refusing mutable main." >&2
  exit 1
fi
root="https://raw.githubusercontent.com/jiangxng/EVO-App-Platform/$ref/deploy/tencent-tokyo"
target="/opt/evo-tokyo"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y docker.io docker-compose-v2 curl openssl
systemctl enable --now docker
docker compose version

if ! id evo-deploy >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash evo-deploy
fi
usermod -aG docker evo-deploy
install -d -m 0750 -o evo-deploy -g evo-deploy "$target"
curl --fail --location --show-error --silent "$root/compose.yaml" -o "$target/compose.yaml"
chown evo-deploy:evo-deploy "$target/compose.yaml"
chmod 0640 "$target/compose.yaml"

if [[ ! -f "$target/.env" ]]; then
  password="$(openssl rand -hex 32)"
  umask 077
  cat > "$target/.env" <<ENV
POSTGRES_PASSWORD=$password
EVO_IMAGE=ghcr.io/jiangxng/evo-app-platform:pending
EVO_REVISION=pending
ENV
  chown evo-deploy:evo-deploy "$target/.env"
  chmod 0600 "$target/.env"
fi

if [[ ! -f "$target/Caddyfile" ]]; then
  template="$(mktemp)"
  trap 'rm -f "$template"' EXIT
  curl --fail --location --show-error --silent "$root/Caddyfile.template" -o "$template"
  preview_password="$(openssl rand -hex 20)"
  preview_hash="$(docker run --rm caddy:2-alpine caddy hash-password --plaintext "$preview_password")"
  sed "s#__EVO_PREVIEW_BCRYPT_HASH__#$preview_hash#g" "$template" > "$target/Caddyfile"
  chown evo-deploy:evo-deploy "$target/Caddyfile"
  chmod 0640 "$target/Caddyfile"
  printf '\nPREVIEW USER: evo\nPREVIEW PASSWORD (save securely, printed only once): %s\n' "$preview_password"
fi

install -d -m 0700 -o evo-deploy -g evo-deploy /home/evo-deploy/.ssh
private_key="/root/evo-tokyo-dev-actions"
if [[ ! -f "$private_key" ]]; then
  ssh-keygen -q -t ed25519 -N "" -f "$private_key" -C "github-actions-evo-tokyo-dev"
fi
pub="$(cat "$private_key.pub")"
authorized="/home/evo-deploy/.ssh/authorized_keys"
touch "$authorized"
if ! grep -Fqx "$pub" "$authorized"; then
  printf '%s\n' "$pub" >> "$authorized"
fi
chown evo-deploy:evo-deploy "$authorized"
chmod 0600 "$authorized"

if [[ ! -f /etc/ssh/ssh_host_ed25519_key.pub ]]; then
  echo "Missing SSH ED25519 host key: inspect SSH configuration manually." >&2
  exit 1
fi
host_pub="$(awk '{print $2}' /etc/ssh/ssh_host_ed25519_key.pub)"
printf '\nBOOTSTRAP COMPLETE. No application was started and no Railway data was changed.\n'
printf 'GitHub environment secret EVO_TOKYO_SSH_KNOWN_HOSTS:\n43.167.252.197 ssh-ed25519 %s\n' "$host_pub"
printf '\nGitHub environment secret EVO_TOKYO_SSH_PRIVATE_KEY: read the file below in the secure Tencent console and paste into GitHub Secrets (NEVER this chat):\n'
printf '  sudo cat %s\n' "$private_key"
printf 'After saving and checking the secret, securely delete the server copy: sudo rm -f %s %s.pub\n' "$private_key" "$private_key"
printf 'Allow TCP 80/443 in the Tencent Lighthouse firewall only when ready for external HTTPS testing.\n'
