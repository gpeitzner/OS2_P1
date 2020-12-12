sudo su
cd /proc
rmmod stats
cd /home/ubuntu/SO2_P1/kernel_modules/stats
make
insmod stats.ko
