sudo su
cd /proc
rmmod ap_grupo3
cd /home/ubuntu/SO2_P1/kernel_modules/processes
make
insmod processes.ko
