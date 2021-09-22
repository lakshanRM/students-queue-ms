import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as XLSX from 'xlsx';

@Processor('create-students')
export class StudentProcessor {
  private readonly logger = new Logger(StudentProcessor.name);

  @Process('transcode')
  handleTranscode(job: Job) {
    this.logger.debug('Converting file tp JSON...');
    const studentsAry = this.readUploadedFile(job.data.file);
    const studentsAryWithAge = this.calculateAge(studentsAry);
    //TODO: Send to buld Insert
    console.log(studentsAryWithAge);
    this.logger.debug('Process Complated...');
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
