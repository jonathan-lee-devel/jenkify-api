import * as crypto from 'crypto';

import { Injectable, Logger } from '@nestjs/common';

import { RandomGenerator } from '../../../../constants/auth.constants';

@Injectable()
export class RandomService {
  constructor(private readonly logger: Logger) {}

  /**
   * Generates a random ID.
   *
   * @async
   * @param {number} [idLength] - The length of the generated ID. If not provided, the default length will be used.
   * @return {Promise<string>} - A promise that resolves to a randomly generated ID as a string.
   */
  async generateRandomId(idLength?: number) {
    return new Promise<string>((resolve, reject) => {
      const adjustedIdLength = idLength ?? RandomGenerator.DEFAULT_ID_LENGTH;
      crypto.randomBytes(adjustedIdLength / 2, (err, buffer) => {
        if (err) {
          this.logger.error(`Error occurred during generateRandomId: ${err}`);
          return reject(err);
        }
        return resolve(buffer.toString('hex'));
      });
    });
  }
}
