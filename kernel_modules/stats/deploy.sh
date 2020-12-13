sudo su
cd /proc
rmmod m_grupo3
cd /home/ubuntu/SO2_P1/kernel_modules/stats
make
insmod stats.ko
