import * as supertest from 'supertest';

declare module 'supertest' {
  interface SuperTest {
    get(url: string): supertest.Test;
    post(url: string): supertest.Test;
    put(url: string): supertest.Test;
    delete(url: string): supertest.Test;
    patch(url: string): supertest.Test;
  }
} 