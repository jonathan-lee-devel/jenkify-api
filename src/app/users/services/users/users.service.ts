import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';

import {User} from '../../models/User.model';
import {UserProfile} from '../../models/UserProfile.model';


/**
 * Service class for managing users.
 */
@Injectable()
export class UsersService {
  /**
   * Constructor for the class.
   * @param {Model<User>} userModel - The user model injected using `InjectModel` decorator.
   */
  constructor(
      @InjectModel(User.name) private readonly userModel: Model<User>,
      @InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfile>,
  ) {}

  /**
   * Finds a user by email.
   *
   * @param {string} email - The email address of the user.
   * @return {Promise<mongoose.Document<?, {}, User>>} A promise that resolves to the user found by email. If no user is found, it resolves to null.
   */
  async findUserByEmail(email: string) {
    return this.userModel.findOne({email}).exec();
  }

  /**
   * Creates a new user.
   *
   * @param {User} newUserData - The new user data to create.
   * @return {Promise<mongoose.Document<?, {}, User>>} A promise that resolves to the created user.
   */
  async createUser(newUserData: User) {
    return this.userModel.create(newUserData);
  }

  /**
   * Creates a new user profile.
   *
   * @param {UserProfile} newUserProfileData - The data of the new user profile.
   * @return {Promise<mongoose.Document<?, {}, UserProfile>>} A Promise representing the creation of the user profile.
   */
  async createUserProfile(newUserProfileData: UserProfile) {
    return this.userProfileModel.create(newUserProfileData);
  }

  /**
   * Retrieves the user profile based on the provided email.
   *
   * @param {string} email - The email of the user.
   * @return {Promise<mongoose.Document<?, {}, UserProfile>>} A promise that resolves with the user profile document,
   *                   or rejects with an error if it cannot be found or there
   *                   was an execution error.
   */
  async getUserProfile(email: string) {
    return this.userProfileModel.findOne({email}, {_id: 0, __v: 0}).exec();
  }
}
