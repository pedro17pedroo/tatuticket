interface TeamsMessage {
  text: string;
  summary?: string;
  themeColor?: string;
  sections?: any[];
  potentialAction?: any[];
}

interface TeamsNotification {
  ticketId: string;
  title: string;
  description: string;
  priority: string;
  assignee?: string;
  webhookUrl: string;
}

class TeamsIntegration {
  private webhookUrls: string[] = [];
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const webhookUrls = process.env.TEAMS_WEBHOOK_URLS?.split(',') || [];
    this.webhookUrls = webhookUrls.filter(url => url.trim());
    
    if (this.webhookUrls.length > 0) {
      this.initialized = true;
      console.log(`🔗 Teams integration initialized with ${this.webhookUrls.length} webhook(s)`);
    } else {
      console.warn('⚠️ Teams integration disabled - missing webhook URLs');
    }
  }

  async sendMessage(message: TeamsMessage, webhookUrl?: string): Promise<boolean> {
    const targetUrls = webhookUrl ? [webhookUrl] : this.webhookUrls;
    
    if (!this.initialized && !webhookUrl) {
      console.log('📝 Mock: Teams message sent');
      return true;
    }

    try {
      const promises = targetUrls.map(async (url) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        return response.ok;
      });

      const results = await Promise.all(promises);
      const success = results.every(result => result);

      if (success) {
        console.log('✅ Teams message sent successfully');
      } else {
        console.error('❌ Some Teams messages failed to send');
      }
      
      return success;
    } catch (error) {
      console.error('❌ Teams integration error:', error);
      return false;
    }
  }

  async sendTicketNotification(notification: TeamsNotification): Promise<boolean> {
    const priorityColors = {
      low: '00FF00',
      medium: 'FFFF00',
      high: 'FF8C00', 
      critical: 'FF0000'
    };

    const message: TeamsMessage = {
      summary: `New support ticket: ${notification.title}`,
      themeColor: priorityColors[notification.priority as keyof typeof priorityColors],
      sections: [
        {
          activityTitle: '🎫 New Support Ticket',
          activitySubtitle: `Priority: ${notification.priority.toUpperCase()}`,
          facts: [
            {
              name: 'Ticket ID',
              value: `#${notification.ticketId}`
            },
            {
              name: 'Title',
              value: notification.title
            },
            {
              name: 'Priority', 
              value: notification.priority.toUpperCase()
            },
            {
              name: 'Assignee',
              value: notification.assignee || 'Unassigned'
            }
          ],
          text: notification.description.substring(0, 300) + (notification.description.length > 300 ? '...' : '')
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'View Ticket',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL}/tickets/${notification.ticketId}`
            }
          ]
        }
      ]
    };

    return this.sendMessage(message, notification.webhookUrl);
  }

  async sendSLAAlert(ticketId: string, timeRemaining: number, webhookUrl?: string): Promise<boolean> {
    const message: TeamsMessage = {
      summary: `SLA Alert for ticket #${ticketId}`,
      themeColor: 'FF0000',
      sections: [
        {
          activityTitle: '🚨 SLA Breach Alert',
          activitySubtitle: `Ticket #${ticketId}`,
          facts: [
            {
              name: 'Time Remaining',
              value: `${Math.floor(timeRemaining / 60)}h ${timeRemaining % 60}m`
            },
            {
              name: 'Status',
              value: 'Urgent Action Required'
            }
          ],
          text: `This ticket is approaching its SLA deadline and requires immediate attention.`
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Take Action',
          targets: [
            {
              os: 'default',
              uri: `${process.env.FRONTEND_URL}/tickets/${ticketId}`
            }
          ]
        }
      ]
    };

    return this.sendMessage(message, webhookUrl);
  }

  async sendDailySummary(summary: any, webhookUrl?: string): Promise<boolean> {
    const message: TeamsMessage = {
      summary: 'Daily Support Summary',
      themeColor: '0078D4',
      sections: [
        {
          activityTitle: '📊 Daily Support Summary',
          activitySubtitle: new Date().toLocaleDateString(),
          facts: [
            {
              name: 'New Tickets',
              value: summary.newTickets.toString()
            },
            {
              name: 'Resolved Tickets',
              value: summary.resolvedTickets.toString()
            },
            {
              name: 'SLA Breaches',
              value: summary.slaBreaches.toString()
            },
            {
              name: 'Average Response Time',
              value: `${summary.avgResponseTime} minutes`
            }
          ]
        }
      ]
    };

    return this.sendMessage(message, webhookUrl);
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const teamsIntegration = new TeamsIntegration();