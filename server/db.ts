// Mock in-memory database for development without DATABASE_URL
import { randomUUID } from 'crypto';
import type { Job, User } from "@shared/schema";

export const isMockDb = true;

// In-memory storage
const users = new Map<string, User>();
const jobs = new Map<string, Job>();
const sessions = new Map<string, any>();

// Demo user constants
const DEMO_USER_ID = "demo-user-123";

// Initialize demo user with 20 credits
users.set(DEMO_USER_ID, {
  id: DEMO_USER_ID,
  username: "demo",
  password: "demo",
  credits: 20
});

// Mock database interface that mimics Drizzle ORM
class MockDatabase {
  // Mock select operation
  select(fields?: any) {
    return new MockSelectQuery(fields);
  }

  // Mock insert operation
  insert(table: any) {
    return new MockInsertQuery(table);
  }

  // Mock update operation
  update(table: any) {
    return new MockUpdateQuery(table);
  }

  // Mock transaction operation
  async transaction(callback: (tx: MockDatabase) => Promise<any>) {
    // For mock, just execute the callback with this instance
    return await callback(this);
  }
}

class MockSelectQuery {
  private fields: any;
  private tableName: string = '';
  private whereCondition: any = null;
  private orderByCondition: any = null;
  private limitValue: number = Infinity;
  private offsetValue: number = 0;

  constructor(fields: any) {
    this.fields = fields;
  }

  from(table: any) {
    // Determine table type based on the table object
    // Handle both Drizzle table objects and our mock tables
    if (table?._?.name === 'users' || table === usersTable || 
        (table && typeof table === 'object' && Object.keys(table).includes('username'))) {
      this.tableName = 'users';
    } else if (table?._?.name === 'jobs' || table === jobsTable ||
               (table && typeof table === 'object' && Object.keys(table).includes('tool'))) {
      this.tableName = 'jobs';
    } else if (table?._?.name === 'sessions' || table === sessionsTable ||
               (table && typeof table === 'object' && Object.keys(table).includes('heavyJobsThisHour'))) {
      this.tableName = 'sessions';
    } else {
      // Fallback: try to determine by table name string representation
      const tableStr = table?.toString?.() || '';
      if (tableStr.includes('users') || (table && table.id && table.username)) {
        this.tableName = 'users';
      } else if (tableStr.includes('jobs') || (table && table.id && table.tool)) {
        this.tableName = 'jobs';
      } else if (tableStr.includes('sessions') || (table && table.id && table.userId)) {
        this.tableName = 'sessions';
      }
    }
    return this;
  }

  where(condition: any) {
    this.whereCondition = condition;
    return this;
  }

  orderBy(condition: any) {
    this.orderByCondition = condition;
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  offset(value: number) {
    this.offsetValue = value;
    return this;
  }

  async execute(): Promise<any[]> {
    let data: any[] = [];

    // Get data from appropriate store
    if (this.tableName === 'users') {
      data = Array.from(users.values());
    } else if (this.tableName === 'jobs') {
      data = Array.from(jobs.values());
    } else if (this.tableName === 'sessions') {
      data = Array.from(sessions.values());
    }

    // Apply where condition (simplified)
    if (this.whereCondition) {
      data = data.filter((item) => {
        // Simple equality check for mock
        const condition = this.whereCondition;
        if (condition.column && condition.value !== undefined) {
          return item[condition.column] === condition.value;
        }
        return true;
      });
    }

    // Apply ordering (simplified - just by createdAt desc for jobs)
    if (this.orderByCondition && this.tableName === 'jobs') {
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Apply pagination
    data = data.slice(this.offsetValue, this.offsetValue + this.limitValue);

    // Apply field selection
    if (this.fields && typeof this.fields === 'object') {
      return data.map(item => {
        const result: any = {};
        for (const key in this.fields) {
          result[key] = item[key];
        }
        return result;
      });
    }

    return data;
  }

  // Make it thenable for await
  then(onFulfilled: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

class MockInsertQuery {
  private table: any;
  private insertValues: any = {};

  constructor(table: any) {
    this.table = table;
  }

  values(data: any) {
    this.insertValues = data;
    return this;
  }

  onConflictDoNothing() {
    return this;
  }

  returning() {
    return this;
  }

  async execute(): Promise<any[]> {
    const id = this.insertValues.id || randomUUID();
    const now = new Date();
    
    const record = {
      ...this.insertValues,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Determine table and insert
    const tableName = this.table?._?.name || this.getTableName(this.table);
    if (tableName === 'users') {
      users.set(id, record);
    } else if (tableName === 'jobs') {
      jobs.set(id, record);
      
      // Simulate job progression
      setTimeout(() => {
        const job = jobs.get(id);
        if (job && job.status === 'queued') {
          // Generate appropriate output URLs based on tool type
          let assetUrls: string[] = [];
          
          switch (job.tool) {
            case 'text2mesh':
              // GLB 3D model URL
              assetUrls = ['https://modelviewer.dev/shared-assets/models/Astronaut.glb'];
              break;
            case 'text2image':
              // Generated image URL
              assetUrls = ['https://picsum.photos/512/512?random=' + Math.random()];
              break;
            case 'texturing':
              // PBR texture maps
              assetUrls = [
                'https://picsum.photos/512/512?random=' + Math.random(), // Diffuse
                'https://picsum.photos/512/512?random=' + Math.random()  // Normal
              ];
              break;
            case 'img2video':
              // MP4 video URL
              assetUrls = ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'];
              break;
            default:
              assetUrls = ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='];
          }
          
          jobs.set(id, {
            ...job,
            status: 'completed',
            assetUrls,
            updatedAt: new Date()
          });
        }
      }, 1500); // 1.5 seconds
      
    } else if (tableName === 'sessions') {
      sessions.set(id, record);
    }

    return [record];
  }

  // Make it thenable
  then(onFulfilled: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected);
  }

  private getTableName(table: any): string {
    if (table && typeof table === 'object') {
      if (table.username || Object.keys(table).includes('username')) return 'users';
      if (table.tool || Object.keys(table).includes('tool')) return 'jobs';
      if (table.heavyJobsThisHour || Object.keys(table).includes('heavyJobsThisHour')) return 'sessions';
    }
    return '';
  }
}

class MockUpdateQuery {
  private table: any;
  private setValues: any = {};
  private whereCondition: any = null;

  constructor(table: any) {
    this.table = table;
  }

  set(updateValues: any) {
    this.setValues = updateValues;
    return this;
  }

  where(condition: any) {
    this.whereCondition = condition;
    return this;
  }

  async execute(): Promise<any[]> {
    const tableName = this.table?._?.name || this.getTableName(this.table);
    let store: Map<string, any>;
    
    if (tableName === 'users') {
      store = users;
    } else if (tableName === 'jobs') {
      store = jobs;
    } else if (tableName === 'sessions') {
      store = sessions;
    } else {
      return [];
    }

    const updates: any[] = [];
    
    // Simple update logic
    if (this.whereCondition && this.whereCondition.column && this.whereCondition.value !== undefined) {
      for (const record of store.values()) {
        if (record[this.whereCondition.column] === this.whereCondition.value) {
          const updatedRecord = {
            ...record,
            ...this.setValues,
            updatedAt: new Date()
          };
          store.set(record.id, updatedRecord);
          updates.push(updatedRecord);
        }
      }
    }

    return updates;
  }

  // Make it thenable
  then(onFulfilled: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected);
  }

  private getTableName(table: any): string {
    if (table && typeof table === 'object') {
      if (table.username || Object.keys(table).includes('username')) return 'users';
      if (table.tool || Object.keys(table).includes('tool')) return 'jobs';
      if (table.heavyJobsThisHour || Object.keys(table).includes('heavyJobsThisHour')) return 'sessions';
    }
    return '';
  }
}

// Mock table objects that match the schema structure
const usersTable = {
  _: { name: 'users' },
  id: { column: 'id' },
  credits: { column: 'credits' }
};

const jobsTable = {
  _: { name: 'jobs' },
  id: { column: 'id' },
  userId: { column: 'userId' },
  createdAt: { column: 'createdAt' }
};

const sessionsTable = {
  _: { name: 'sessions' },
  id: { column: 'id' },
  userId: { column: 'userId' },
  heavyJobsThisHour: { column: 'heavyJobsThisHour' }
};

// Mock eq function for where conditions
function eq(column: any, value: any) {
  return { column: column.column, value };
}

function and(...conditions: any[]) {
  // Simplified - just return first condition for mock
  return conditions[0];
}

function gt(column: any, value: any) {
  return { column: column.column, value, operator: 'gt' };
}

function desc(column: any) {
  return { column: column.column, order: 'desc' };
}

function sql(strings: TemplateStringsArray, ...values: any[]) {
  // Mock implementation for SQL expressions
  return { sql: strings.join(''), values };
}

// Create mock database instance
export const db = new MockDatabase();

// Export the schemas needed by the job service
export { eq, and, gt, desc, sql };

// Utility functions for API routes
export async function getCredits(userId: string = DEMO_USER_ID): Promise<number> {
  const user = users.get(userId);
  return user?.credits || 0;
}

export async function setCredits(userId: string = DEMO_USER_ID, credits: number): Promise<void> {
  const user = users.get(userId);
  if (user) {
    users.set(userId, { ...user, credits });
  }
}

export async function deductCredits(userId: string = DEMO_USER_ID, amount: number): Promise<boolean> {
  const user = users.get(userId);
  if (user && user.credits >= amount) {
    users.set(userId, { ...user, credits: user.credits - amount });
    return true;
  }
  return false;
}

export async function addCredits(userId: string = DEMO_USER_ID, amount: number): Promise<void> {
  const user = users.get(userId);
  if (user) {
    users.set(userId, { ...user, credits: user.credits + amount });
  }
}

export async function createJob(jobData: Partial<Job>): Promise<Job> {
  const id = randomUUID();
  const now = new Date();
  
  const job: Job = {
    id,
    tool: jobData.tool || 'text2image',
    prompt: jobData.prompt || '',
    inputs: jobData.inputs || null,
    status: 'queued',
    assetUrls: null,
    provider: jobData.provider || 'SIM',
    providerJobId: null,
    meta: null,
    userId: jobData.userId || DEMO_USER_ID,
    sessionId: jobData.sessionId || 'demo-session',
    creditsUsed: jobData.creditsUsed || 1,
    createdAt: now,
    updatedAt: now,
    ...jobData
  };
  
  jobs.set(id, job);
  
  // Simulate job completion
  setTimeout(() => {
    const currentJob = jobs.get(id);
    if (currentJob && currentJob.status === 'queued') {
      jobs.set(id, {
        ...currentJob,
        status: 'completed',
        assetUrls: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='],
        updatedAt: new Date()
      });
    }
  }, 1500);
  
  return job;
}

export async function getJob(jobId: string): Promise<Job | null> {
  return jobs.get(jobId) || null;
}

export async function listJobs(userId: string = DEMO_USER_ID, limit: number = 20, offset: number = 0): Promise<Job[]> {
  const userJobs = Array.from(jobs.values())
    .filter(job => job.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);
  
  return userJobs;
}