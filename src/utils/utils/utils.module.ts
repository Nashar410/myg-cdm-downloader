import { Module } from '@nestjs/common';
import { AlldebridService } from '../alldebrid/alldebrid.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [AlldebridService],
  exports: [AlldebridService]
})
export class UtilsModule {}
