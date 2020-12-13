import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'web';

  constructor(private httpClient: HttpClient) {}

  public chartOptions = {
    scaleShowVerticalLines: false,
    responsive: true,
  };
  public chartData = [
    { data: [65, 59, 80, 81, 56, 55, 40, 33, 58, 97], label: 'RAM' },
    { data: [28, 48, 40, 19, 86, 27, 90, 23, 11, 68], label: 'CPU' },
  ];
  public chartLabels: string[] = [];

  ngOnInit() {
    this.httpClient.get('http://so2-practice1.ddns.net/stats').subscribe(
      (data) => {
        console.log(data);
      },
      (error) => {
        console.log(error);
      }
    );
    setInterval(() => {
      let date: Date = new Date(Date.now());
      let currentTime: string =
        date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      if (this.chartLabels.length === 0) {
        this.chartLabels.push(currentTime);
      } else {
        if (this.chartLabels.length === 10) {
          for (let i = 0; i < this.chartLabels.length - 1; i++) {
            const element = this.chartLabels[i + 1];
            this.chartLabels[i] = element;
          }
          this.chartLabels[9] = currentTime;
        } else {
          this.chartLabels.push(currentTime);
        }
      }
    }, 1500);
  }
}
