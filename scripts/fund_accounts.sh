#!/bin/bash
docker-compose exec enigmadev \
  enigmacli tx send b enigma1pkptre7fdkl6gfrzlesjjvhxhlc3r4gm277l4c 10000000000uscrt -y \
  --keyring-backend test
docker-compose exec enigmadev \
  enigmacli tx send b enigma1klqgym9m7pcvhvgsl8mf0elshyw0qhruy4aqxx 10000000000uscrt -y \
  --keyring-backend test