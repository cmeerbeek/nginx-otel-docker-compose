import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 5 }, // simulate ramp-up of traffic from 1 to 30 users over 1 minute.
    { duration: '3m', target: 5 }, // stay at 30 users for 3 minutes
    { duration: '1m', target: 0 }, // ramp-down to 0 users
  ],

  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
  },
};

export default function () {
  http.get('http://nginx-proxy/info');
  sleep(1);
}