import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';

import {AbstractModel} from '../../../data/abstract.model';

@Schema({timestamps: true})
export class RegistrationToken extends AbstractModel {
    @Prop({required: true, unique: true})
    email: string;

    @Prop({required: true, unique: true})
    value: string;

    @Prop({required: true, unique: false})
    expiryDate: Date;
}

export const RegistrationTokenSchema = SchemaFactory.createForClass(RegistrationToken);
