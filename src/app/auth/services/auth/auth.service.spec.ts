import {TestBed} from '@automock/jest';

import {AuthService} from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const {unit} = TestBed.create(AuthService).compile();
    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
