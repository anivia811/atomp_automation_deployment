#!/bin/bash
  
now=$(date +'%d_%b_%Y_%H_%M_%S')

OUTPUT=docker_stats_$now.log

# while true; do printf "\n$(date +'%d_%b_%Y_%H_%M_%S'):\n" | tee --append stats_$now.txt;  docker stats --no-stream | tee --append stats_$now.txt; sleep 1; done
while true; do
  echo "$(date +'%d_%b_%Y_%H_%M_%S')" >> $OUTPUT
  docker stats --no-stream >> $OUTPUT
  sleep 1
done
