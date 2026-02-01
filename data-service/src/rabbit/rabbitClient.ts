import amqp, { type Connection, type Channel } from 'amqplib';

let connection: Connection | null = null;
let channel: Channel | null = null;

const EXCHANGE_NAME = 'ff_events';
const RABBITMQ_URL = process.env['RABBITMQ_URL'] ?? 'amqp://localhost:5672';

export async function connectRabbitMQ(): Promise<void> {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Don't throw - allow the app to run without RabbitMQ for development
  }
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    await channel?.close();
    await connection?.close();
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
}

export async function publishProjectEvent(
  routingKey: string,
  data: unknown
): Promise<void> {
  if (!channel) {
    console.warn('RabbitMQ not connected, skipping publish');
    return;
  }

  const message = Buffer.from(JSON.stringify(data));
  channel.publish(EXCHANGE_NAME, routingKey, message, {
    persistent: true,
    contentType: 'application/json',
    timestamp: Date.now(),
  });
}

export async function subscribeToProjectEvents(
  pattern: string,
  handler: (routingKey: string, data: unknown) => void
): Promise<void> {
  if (!channel) {
    console.warn('RabbitMQ not connected, skipping subscribe');
    return;
  }

  const { queue } = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(queue, EXCHANGE_NAME, pattern);

  channel.consume(queue, (msg) => {
    if (msg) {
      const routingKey = msg.fields.routingKey;
      const data = JSON.parse(msg.content.toString()) as unknown;
      handler(routingKey, data);
      channel?.ack(msg);
    }
  });
}
