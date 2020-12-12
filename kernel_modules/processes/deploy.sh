sudo su
cd /proc
rmmod processes
cd /home/ubuntu/SO2_P1/kernel_modules/processes
make
insmod processes.ko
