import { config } from '../config/app.config';

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
}

interface SlackNotification {
  ticketId: string;
  title: string;
  description: string;
  priority: string;
  assignee?: string;
  channel: string;
}

class SlackIntegration {
  private webhookUrl: string | null = null;
  private botToken: string | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
    this.botToken = process.env.SLACK_BOT_TOKEN || null;
    
    if (this.webhookUrl || this.botToken) {
      this.initialized = true;
      console.log('🔗 Slack integration initialized');
    } else {
      console.warn('⚠️ Slack integration disabled - missing configuration');
    }
  }

  async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.initialized) {
      console.log('📝 Mock: Slack message sent to', message.channel);
      return true;
    }

    try {
      const response = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        console.log('✅ Slack message sent successfully');
        return true;
      } else {
        console.error('❌ Failed to send Slack message:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Slack integration error:', error);
      return false;
    }
  }

  async sendTicketNotification(notification: SlackNotification): Promise<boolean> {
    const priorityEmoji = {
      low: '🟢',
      medium: '🟡', 
      high: '🟠',
      critical: '🔴'
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎫 Novo Ticket: ${notification.title}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*ID:* ${notification.ticketId}`
          },
          {
            type: 'mrkdwn',
            text: `*Prioridade:* ${priorityEmoji[notification.priority as keyof typeof priorityEmoji] || '⚪'} ${notification.priority}`
          },
          {
            type: 'mrkdwn',
            text: `*Responsável:* ${notification.assignee || 'Não atribuído'}`
          },
          {
            type: 'mrkdwn',
            text: `*Canal:* ${notification.channel}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Descrição:*\n${notification.description}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Ver Ticket'
            },
            url: `${process.env.APP_URL}/organization/tickets/${notification.ticketId}`,
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Atribuir a mim'
            },
            action_id: `assign_ticket_${notification.ticketId}`
          }
        ]
      }
    ];

    const message: SlackMessage = {
      channel: notification.channel,
      text: `Novo ticket ${notification.ticketId}: ${notification.title}`,
      blocks: blocks,
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${priorityEmoji[notification.priority as keyof typeof priorityEmoji]} New Support Ticket`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Ticket ID:*\n#${notification.ticketId}`
            },
            {
              type: 'mrkdwn',
              text: `*Priority:*\n${notification.priority.toUpperCase()}`
            },
            {
              type: 'mrkdwn',
              text: `*Title:*\n${notification.title}`
            },
            {
              type: 'mrkdwn',
              text: `*Assignee:*\n${notification.assignee || 'Unassigned'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Description:*\n${notification.description.substring(0, 200)}${notification.description.length > 200 ? '...' : ''}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Ticket'
              },
              url: `${process.env.FRONTEND_URL}/tickets/${notification.ticketId}`,
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Assign to Me'
              },
              action_id: `assign_ticket_${notification.ticketId}`
            }
          ]
        }
      ]
    };

    return this.sendMessage(message);
  }

  async sendSLAAlert(ticketId: string, timeRemaining: number, channel: string): Promise<boolean> {
    const message: SlackMessage = {
      channel,
      text: `🚨 SLA Alert for ticket #${ticketId}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 SLA Breach Alert'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Ticket #${ticketId} will breach SLA in ${Math.floor(timeRemaining / 60)} hours and ${timeRemaining % 60} minutes.`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Take Action'
              },
              url: `${process.env.FRONTEND_URL}/tickets/${ticketId}`,
              style: 'danger'
            }
          ]
        }
      ]
    };

    return this.sendMessage(message);
  }

  async createChannel(name: string, purpose: string): Promise<string | null> {
    if (!this.botToken) {
      console.log(`📝 Mock: Slack channel '${name}' created`);
      return `mock_channel_${Date.now()}`;
    }

    try {
      const response = await fetch('https://slack.com/api/conversations.create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
          purpose
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        console.log('✅ Slack channel created:', data.channel.id);
        return data.channel.id;
      } else {
        console.error('❌ Failed to create Slack channel:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Slack channel creation error:', error);
      return null;
    }
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const slackIntegration = new SlackIntegration();