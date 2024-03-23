import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';

import {AbstractModel} from '../../../data/abstract.model';

@Schema({timestamps: true})
export class UserProfile extends AbstractModel {
    @Prop({required: true, unique: true})
    email: string;

    @Prop({required: true, unique: false})
    firstName: string;

    @Prop({required: true, unique: false})
    lastName: string;

    @Prop({required: true, unique: false})
    displayName: string;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
