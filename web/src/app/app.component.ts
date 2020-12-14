import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

export interface Process {
  padre: number;
  user: number;
  pid: number;
  nombre: string;
  estado: string;
  usage: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'web';

  constructor(private httpClient: HttpClient) {}

  chartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true,
  };
  chartData: any = [
    { data: [], label: 'RAM' },
    { data: [], label: 'CPU' },
  ];
  chartLabels: string[] = [];
  totalRam: string = '0mb';
  usedRam: string = '0mb';
  ramPercentage: string = '0%';
  cpuPercentage: string = '0%';
  processes: Process[] = [];
  running: number = 0;
  sleeping: number = 0;
  stopped: number = 0;
  zombie: number = 0;
  idle: number = 0;
  user: string = '';
  password: string = '';
  error: string = '';
  access: boolean = false;

  getSystemInformationData(): void {
    this.httpClient.get('http://so2-practice1.ddns.net/stats').subscribe(
      (data: any) => {
        if (data.RamPercentage > 100) {
          data.RamPercentage = 100;
        }
        if (data.CpuPercentage > 100) {
          data.CpuPercentage = 100;
        }
        this.totalRam = data.TotalRam + 'mb';
        this.usedRam = data.UsedRam + 'mb';
        this.ramPercentage = data.RamPercentage + '%';
        this.cpuPercentage = data.CpuPercentage + '%';
        let date: Date = new Date(Date.now());
        let currentTime: string =
          date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        if (this.chartLabels.length === 0) {
          this.chartData[0].data.push(parseInt(data.RamPercentage));
          this.chartData[1].data.push(parseInt(data.CpuPercentage));
          this.chartLabels.push(currentTime);
        } else {
          if (this.chartLabels.length === 10) {
            for (let i = 0; i < this.chartLabels.length - 1; i++) {
              const element = this.chartLabels[i + 1];
              this.chartData[0].data[i] = this.chartData[0].data[i + 1];
              this.chartData[1].data[i] = this.chartData[1].data[i + 1];
              this.chartLabels[i] = element;
            }
            this.chartData[0].data[9] = parseInt(data.RamPercentage);
            this.chartData[1].data[9] = parseInt(data.CpuPercentage);
            this.chartLabels[9] = currentTime;
          } else {
            this.chartData[0].data.push(parseInt(data.RamPercentage));
            this.chartData[1].data.push(parseInt(data.CpuPercentage));
            this.chartLabels.push(currentTime);
          }
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  getProcessesData(): void {
    this.httpClient.get('http://so2-practice1.ddns.net/procesos').subscribe(
      (data: any) => {
        this.processes = data.procesos;
        this.processes.reverse();
        this.running = 0;
        this.sleeping = 0;
        this.zombie = 0;
        this.stopped = 0;
        this.idle = 0;
        this.processes.map((process: Process) => {
          switch (process.estado.toString()) {
            case '0':
              this.running += 1;
              process.estado = 'Running';
              return process;
            case '1':
            case '2':
              this.sleeping += 1;
              process.estado = 'Sleeping';
              return process;
            case '4':
            case '128':
              this.zombie += 1;
              process.estado = 'Zombie';
              return process;
            case '8':
            case '260':
              this.stopped += 1;
              process.estado = 'Stopped';
              return process;
            case '1026':
              this.idle += 1;
              process.estado = 'Idle';
              return process;
            default:
              return process;
          }
        });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  killProcess(process: Process): void {
    this.httpClient
      .get('http://so2-practice1.ddns.net/matarproceso/' + process.pid)
      .subscribe(
        (data) => {},
        (error) => {
          console.log(error);
        }
      );
  }

  login(): void {
    console.log(this.user, this.password);
    if (this.user === 'admin' && this.password == 'admin') {
      this.error = '';
      setInterval(() => {
        this.getSystemInformationData();
        this.getProcessesData();
      }, 1500);
      this.access = true;
    } else {
      this.error = 'Bad credentials.';
    }
  }
}
