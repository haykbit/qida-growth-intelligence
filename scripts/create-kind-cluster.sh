#!/usr/bin/env sh
set -eu

if ! kind get clusters | grep -qx qida; then
  kind create cluster --config infra/kind-config.yaml
fi

kubectl config use-context kind-qida

