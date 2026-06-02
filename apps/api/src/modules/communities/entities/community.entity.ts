export class CommunityEntity {
  id: string;
  slug: string;
  name: string;
  description?: string;
  tokenGated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
