 ## Kafka communication steps

 Give permission to all of the .sh files inside the `kafka/bin` folder, if you see permission denied error while running below scripts.

```s
chmod x+u ./*.sh
```
 
 
 ```s
# Create Topic 

./kafka-topics.sh --create --bootstrap-server b-1.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-3.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-2.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092 --replication-factor 2 --partitions 1 --topic "octank.netflow"
```

```
# Print existing topic names from kafka server

./kafka-topics.sh --list --bootstrap-server b-1.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-3.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-2.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092

```

```
# Publish message to Topic 

./kafka-console-producer.sh --broker-list "b-1.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-3.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-2.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092" --topic "octank.netflow"
```

```
# Subscribe to Topic 

./kafka-console-consumer.sh --bootstrap-server "b-1.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-3.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092,b-2.rt-demo1.49en21.c6.kafka.us-east-1.amazonaws.com:9092" --topic "octank.netflow" --from-beginning
```