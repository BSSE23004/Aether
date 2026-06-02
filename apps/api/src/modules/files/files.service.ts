import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  async get(id: string) {
    return { id, url: 'https://ipfs.example/' + id };
  }
}
