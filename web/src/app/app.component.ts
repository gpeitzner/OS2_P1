import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

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

  ngOnInit() {
    setInterval(() => {
      this.getSystemInformationData();
    }, 1500);
  }

  getSystemInformationData(): void {
    this.httpClient.get('http://so2-practice1.ddns.net/stats').subscribe(
      (data: any) => {
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
}
