import {TestBed} from '@automock/jest';

import {TokenHoldService} from './token-hold.service';

describe('TokenHoldService', () => {
  let service: TokenHoldService;

  beforeEach(async () => {
    const {unit} = TestBed.create(TokenHoldService).compile();
    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
