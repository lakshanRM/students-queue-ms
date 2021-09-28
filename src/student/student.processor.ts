import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as XLSX from 'xlsx';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

@WebSocketGateway()
@Processor('create-students')
export class StudentProcessor {
  private readonly logger = new Logger(StudentProcessor.name);
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
    });
  }

  @WebSocketServer()
  server;

  @Process('transcode')
  async handleTranscode(job: Job) {
    this.logger.debug('Converting file tp JSON...');
    const studentsAry = this.readUploadedFile(job.data.file);
    const studentsAryWithAge = this.calculateAge(studentsAry);

    await this.client
      .send('createBulk', studentsAryWithAge)
      .subscribe((res) => {
        if (res.status == 'success') {
          this.server.emit('message', 'Upload Complete.');
          this.logger.debug('Process Complated...');
        }
      });
  }

  readUploadedFile(filePath: string) {
    const workbook = XLSX.readFile(filePath, {
      dateNF: 'mm/dd/yyyy',
    });
    const sheet_name_list = workbook.SheetNames;
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
      raw: false,
    });
  }

  calculateAge(studentsAry) {
    studentsAry.forEach((s: any) => {
      s.age = this.getStudentAge(s.dob);
    });
    return studentsAry;
  }

  getStudentAge(dob: string) {
    const _dob = new Date(dob);
    const month_diff = Date.now() - _dob.getTime();
    const age_dt = new Date(month_diff);
    const year = age_dt.getUTCFullYear();
    return Math.abs(year - 1970);
  }
}
