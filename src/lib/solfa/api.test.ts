import { describe, expect, it } from 'vitest';
import { describeJob, isPending, type Job } from './api';

const job = (fields: Partial<Job>): Job => ({
  id: 'x',
  name: 'Song',
  status: 'queued',
  stage: 'queued',
  created: 0,
  ...fields,
});

describe('a song with no solfa yet', () => {
  it('is pending while queued or on its first part, so the player waits instead of saying "not found"', () => {
    expect(isPending(job({ status: 'queued' }))).toBe(true);
    expect(isPending(job({ status: 'running', stage: 'loading models' }))).toBe(true);
    expect(isPending(job({ status: 'error', error: 'boom' }))).toBe(false);
    expect(isPending(job({ status: 'done' }))).toBe(false);
  });

  it('says where it is', () => {
    expect(describeJob(job({ status: 'queued', queue_position: 1 }))).toBe(
      'Waiting for the song ahead to finish',
    );
    expect(describeJob(job({ status: 'running', stage: 'decoding' }))).toBe('Getting started');
    expect(describeJob(job({ status: 'running', total_seconds: 200, processed_seconds: 30 }))).toBe(
      'Solfa ready up to 0:30 of 3:20',
    );
  });
});
