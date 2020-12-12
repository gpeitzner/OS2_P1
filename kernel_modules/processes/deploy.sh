sudo su
cd /proc
rmmod processes
cd ~/SO2_P1/kernel_modules/processes
make
insmod processes.ko
