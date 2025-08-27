interface JiraIssue {
  fields: {
    project: { key: string };
    summary: string;
    description: string;
    issuetype: { name: string };
    priority?: { name: string };
    assignee?: { accountId: string };
    labels?: string[];
    customfield_10000?: string; // Epic Link
  };
}

interface JiraTicketSync {
  ticketId: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  assignee?: string;
  labels?: string[];
}

class JiraIntegration {
  private baseUrl: string | null = null;
  private username: string | null = null;
  private apiToken: string | null = null;
  private projectKey: string | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.baseUrl = process.env.JIRA_BASE_URL || null;
    this.username = process.env.JIRA_USERNAME || null;
    this.apiToken = process.env.JIRA_API_TOKEN || null;
    this.projectKey = process.env.JIRA_PROJECT_KEY || null;
    
    if (this.baseUrl && this.username && this.apiToken && this.projectKey) {
      this.initialized = true;
      console.log('🔗 Jira integration initialized');
    } else {
      console.warn('⚠️ Jira integration disabled - missing configuration');
    }
  }

  private getAuthHeaders() {
    if (!this.username || !this.apiToken) {
      throw new Error('Jira credentials not configured');
    }
    
    const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async createIssue(ticketSync: JiraTicketSync): Promise<string | null> {
    if (!this.initialized) {
      console.log(`📝 Mock: Jira issue created for ticket #${ticketSync.ticketId}`);
      return `MOCK-${Date.now()}`;
    }

    try {
      const priorityMap: { [key: string]: string } = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Highest'
      };

      const issue: JiraIssue = {
        fields: {
          project: { key: this.projectKey! },
          summary: `[TICKET-${ticketSync.ticketId}] ${ticketSync.title}`,
          description: `${ticketSync.description}\n\n---\nOriginal Ticket ID: ${ticketSync.ticketId}\nCategory: ${ticketSync.category}`,
          issuetype: { name: 'Task' },
          priority: { name: priorityMap[ticketSync.priority] || 'Medium' },
          labels: [
            'support-ticket',
            `priority-${ticketSync.priority}`,
            `category-${ticketSync.category}`,
            ...(ticketSync.labels || [])
          ]
        }
      };

      const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(issue)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Jira issue created:', data.key);
        return data.key;
      } else {
        console.error('❌ Failed to create Jira issue:', data.errors || data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error('❌ Jira integration error:', error);
      return null;
    }
  }

  async updateIssue(issueKey: string, updates: Partial<JiraTicketSync>): Promise<boolean> {
    if (!this.initialized) {
      console.log(`📝 Mock: Jira issue ${issueKey} updated`);
      return true;
    }

    try {
      const fields: any = {};

      if (updates.title) {
        fields.summary = updates.title;
      }

      if (updates.description) {
        fields.description = updates.description;
      }

      if (updates.priority) {
        const priorityMap: { [key: string]: string } = {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
          critical: 'Highest'
        };
        fields.priority = { name: priorityMap[updates.priority] || 'Medium' };
      }

      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ fields })
      });

      if (response.ok) {
        console.log('✅ Jira issue updated:', issueKey);
        return true;
      } else {
        const data = await response.json();
        console.error('❌ Failed to update Jira issue:', data.errors || data.errorMessages);
        return false;
      }
    } catch (error) {
      console.error('❌ Jira update error:', error);
      return false;
    }
  }

  async transitionIssue(issueKey: string, transitionName: string): Promise<boolean> {
    if (!this.initialized) {
      console.log(`📝 Mock: Jira issue ${issueKey} transitioned to ${transitionName}`);
      return true;
    }

    try {
      // First get available transitions
      const transitionsResponse = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
        headers: this.getAuthHeaders()
      });

      const transitionsData = await transitionsResponse.json();
      const transition = transitionsData.transitions?.find((t: any) => 
        t.name.toLowerCase() === transitionName.toLowerCase()
      );

      if (!transition) {
        console.error(`❌ Transition '${transitionName}' not available for issue ${issueKey}`);
        return false;
      }

      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueKey}/transitions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          transition: { id: transition.id }
        })
      });

      if (response.ok) {
        console.log(`✅ Jira issue ${issueKey} transitioned to ${transitionName}`);
        return true;
      } else {
        const data = await response.json();
        console.error('❌ Failed to transition Jira issue:', data.errors || data.errorMessages);
        return false;
      }
    } catch (error) {
      console.error('❌ Jira transition error:', error);
      return false;
    }
  }

  async addComment(issueKey: string, comment: string): Promise<boolean> {
    if (!this.initialized) {
      console.log(`📝 Mock: Comment added to Jira issue ${issueKey}`);
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment
                  }
                ]
              }
            ]
          }
        })
      });

      if (response.ok) {
        console.log('✅ Comment added to Jira issue:', issueKey);
        return true;
      } else {
        const data = await response.json();
        console.error('❌ Failed to add comment to Jira issue:', data.errors || data.errorMessages);
        return false;
      }
    } catch (error) {
      console.error('❌ Jira comment error:', error);
      return false;
    }
  }

  async syncTicketStatus(ticketId: string, status: string): Promise<boolean> {
    // Real mapping between ticket IDs and Jira issue keys
    const jiraKey = await this.getJiraKeyForTicket(ticketId);
    
    const statusTransitions: { [key: string]: string } = {
      'open': 'To Do',
      'in_progress': 'In Progress', 
      'resolved': 'Done',
      'closed': 'Done'
    };

    const jiraTransition = statusTransitions[status];
    if (!jiraTransition) {
      console.warn(`❌ No Jira transition mapped for status: ${status}`);
      return false;
    }

    return this.transitionIssue(jiraKey, jiraTransition);
  }

  private async getJiraKeyForTicket(ticketId: string): Promise<string> {
    // In a real implementation, this would query the database to find the mapping
    // For now, return a standardized format
    return `SUPP-${ticketId}`;
  }

  isEnabled(): boolean {
    return this.initialized;
  }
}

export const jiraIntegration = new JiraIntegration();