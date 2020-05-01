#!/bin/bash
INIT="{\"count\": 0}"
docker-compose exec enigmadev \
  enigmacli tx compute instantiate 1 "$INIT" --from a --keyring-backend test --label "my counter" -y
