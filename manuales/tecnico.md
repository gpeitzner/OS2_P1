# Manual Tecnico Practica 1 Sistemas Operativos 2

Diciembre 2020

## API goolang

Para dar solucion a la practica y brindar acceso a los datos del sistema, esta api leera los archivos que los modulos del kernel crean en la carpeta proc del sistema, estos archivos se encuentran escritos en formato json para facilitar su transmision por internet.

#### Codigo API Goolang

    package main
    import (
    	"encoding/json"
    	"fmt"
    	"github.com/gorilla/mux"
    	"log"
    	"net/http"
    	"os/exec"
    )
    type MonitorRam struct {
    	// Valores en MB
    	RamTotal int
    	RamConsumida int
    	PorcentajeConsumida int
    	RamLibre int
    }
    type MonitorCpu struct {
    	// Valor en MB
    	CpuTotal int
    	CpuConsumida int
    	PorcentajeConsumido int
    	CpuLibre int
    }
    type MonitorProcesos struct {
    	Total string
    	EnEjecucio string
    	Suspendidos string
    	Detenidos string
    	Zombies string
    	Procesos []Proceso
    }
    type Proceso struct {
    	Pid string
    	Nombre string
    	Usuario string
    	Estado string
    	Ram string
    	Hijos []Hijo
    }
    type Hijo struct {
    	Pid string
    	Nombre string
    }
    func Procesos(w http.ResponseWriter, req *http.Request) {
    	var procesos []Proceso
    	pp1 := Proceso{
    		Pid:     "pid_1",
    		Nombre:  "proc",
    		Usuario: "proc",
    		Estado:  "proc",
    		Ram:     "proc",
    		Hijos: []Hijo{{
    			Pid:    "pid_hijo_1",
    			Nombre: "nombre_hijo",
    		}, {
    			Pid:    "pid_hijo_2",
    			Nombre: "nombre_hijo",
    		}},
    	}
    	pp2 := Proceso{
    		Pid:     "pid_2",
    		Nombre:  "proc",
    		Usuario: "proc",
    		Estado:  "proc",
    		Ram:     "proc",
    		Hijos: []Hijo{{
    			Pid:    "pid_hijo_1",
    			Nombre: "nombre_hijo",
    		}, {
    			Pid:    "pid_hijo_2",
    			Nombre: "nombre_hijo",
    		}, {
    			Pid:    "pid_hijo_3",
    			Nombre: "nombre_hijo",
    		}},
    	}
    	procesos = append(procesos, pp1,pp2)
    	monitor := MonitorProcesos{
    		Total:       "50",
    		EnEjecucio:  "10",
    		Suspendidos: "10",
    		Detenidos:   "10",
    		Zombies:     "10",
    		Procesos:    procesos,
    	}
    	json.NewEncoder(w).Encode(monitor)
    }
    func Ram(w http.ResponseWriter, req *http.Request) {
    	mr := MonitorRam{
    		RamTotal:            100,
    		RamConsumida:        300,
    		PorcentajeConsumida: 400,
    		RamLibre:            100,
    	}
    	json.NewEncoder(w).Encode(mr)
    }
    func Cpu(w http.ResponseWriter, req *http.Request) {
    	mc := MonitorCpu{
    		CpuTotal:            0,
    		CpuConsumida:        0,
    		PorcentajeConsumido: 0,
    		CpuLibre:            0,
    	}
    	json.NewEncoder(w).Encode(mc)
    }
    func Matar(w http.ResponseWriter, req *http.Request) {
    	pid := mux.Vars(req)["pid"]
    	fmt.Println("El proceso a eliminar es:", pid)
    	// Matando proceso seleccionado
    	err := exec.Command("kill", pid).Run()
    	if err != nil {
    		fmt.Println("Error al intentar eliminar el proceso:", pid)
    	} else {
    		fmt.Println("Proceso eliminado ;)")
    	}
    	fmt.Println("")
    }
    func main() {
    	router := mux.NewRouter()
    	router.HandleFunc("/procesos", Procesos).Methods("GET")
    	router.HandleFunc("/ram", Ram).Methods("GET")
    	router.HandleFunc("/cpu", Cpu).Methods("GET")
    	router.HandleFunc("/matarproceso/{pid}", Matar).Methods("GET")
    	log.Fatal(http.ListenAndServe(":80",router))
    }

## Monitor de Memoria

El monitor de memoria muestra la informacion de consumo de memoria RAM en procentaje y el consumo de cpu en tiempo real. Transmite esta informacion a travez del API con el siguiente formato.
![Ejemplo JSON Memoria](memoria.png)

#### Codigo Monitor de Memoria

    #include <linux/init.h>
    #include <linux/module.h>
    #include <linux/kernel.h>
    #include <linux/fs.h>
    #include <linux/seq_file.h>
    #include <linux/mm.h>
    #include <linux/proc_fs.h>
    #include <linux/cpumask.h>
    #include <linux/interrupt.h>
    #include <linux/kernel_stat.h>
    #include <linux/sched.h>
    #include <linux/sched/stat.h>
    #include <linux/slab.h>
    #include <linux/time.h>
    #include <linux/irqnr.h>
    #include <linux/sched/cputime.h>
    #include <linux/tick.h>
    u64 t_usage0, t_total0 = 0;
    #ifdef arch_idle_time
    static u64 get_idle_time(struct kernel_cpustat *kcs, int cpu)
    {
    	u64 idle;
    	idle = kcs->cpustat[CPUTIME_IDLE];
    	if (cpu_online(cpu) && !nr_iowait_cpu(cpu))
    		idle += arch_idle_time(cpu);
    	return idle;
    }
    static u64 get_iowait_time(struct kernel_cpustat *kcs, int cpu)
    {
    	u64 iowait;
    	iowait = kcs->cpustat[CPUTIME_IOWAIT];
    	if (cpu_online(cpu) && nr_iowait_cpu(cpu))
    		iowait += arch_idle_time(cpu);
    	return iowait;
    }
    #else
    static u64 get_idle_time(struct kernel_cpustat *kcs, int cpu)
    {
    	u64 idle, idle_usecs = -1ULL;
    	if (cpu_online(cpu))
    		idle_usecs = get_cpu_idle_time_us(cpu, NULL);
    	if (idle_usecs == -1ULL)
    		/* !NO_HZ or cpu offline so we can rely on cpustat.idle */
    		idle = kcs->cpustat[CPUTIME_IDLE];
    	else
    		idle = idle_usecs * NSEC_PER_USEC;
    	return idle;
    }
    static u64 get_iowait_time(struct kernel_cpustat *kcs, int cpu)
    {
    	u64 iowait, iowait_usecs = -1ULL;
    	if (cpu_online(cpu))
    		iowait_usecs = get_cpu_iowait_time_us(cpu, NULL);
    	if (iowait_usecs == -1ULL)
    		/* !NO_HZ or cpu offline so we can rely on cpustat.iowait */
    		iowait = kcs->cpustat[CPUTIME_IOWAIT];
    	else
    		iowait = iowait_usecs * NSEC_PER_USEC;
    	return iowait;
    }
    #endif
    static int my_proc_show(struct seq_file *m, void *v)
    {
    	struct sysinfo info;
    	long available, ram_usage;
    	int i, j;
    	u64 user, nice, system, idle, iowait, irq, softirq, steal, t_total, t_idle, t_usage, cpu_usage;
    	u64 guest, guest_nice;
    	u64 sum = 0;
    	u64 sum_softirq = 0;
    	unsigned int per_softirq_sums[NR_SOFTIRQS] = {0};
    	int32_t total_ram = 0;
    	struct timespec64 boottime;
    	//RAM
    	si_meminfo(&info);
    	available = si_mem_available();
    	ram_usage = ((info.totalram - available - info.bufferram) * 100) / (info.totalram);
    	total_ram = ((uint64_t) info.totalram * info.mem_unit)/1024;
    	//CPU
    	user = nice = system = idle = iowait =
    		irq = softirq = steal = 0;
    	guest = guest_nice = 0;
    	getboottime64(&boottime);

    	for_each_possible_cpu(i)
    	{
    		struct kernel_cpustat *kcs = &kcpustat_cpu(i);

    		user += kcs->cpustat[CPUTIME_USER];
    		nice += kcs->cpustat[CPUTIME_NICE];
    		system += kcs->cpustat[CPUTIME_SYSTEM];
    		idle += get_idle_time(kcs, i);
    		iowait += get_iowait_time(kcs, i);
    		irq += kcs->cpustat[CPUTIME_IRQ];
    		softirq += kcs->cpustat[CPUTIME_SOFTIRQ];
    		steal += kcs->cpustat[CPUTIME_STEAL];
    		guest += kcs->cpustat[CPUTIME_GUEST];
    		guest_nice += kcs->cpustat[CPUTIME_GUEST_NICE];
    		sum += kstat_cpu_irqs_sum(i);

    		for (j = 0; j < NR_SOFTIRQS; j++)
    		{
    			unsigned int softirq_stat = kstat_softirqs_cpu(j, i);

    			per_softirq_sums[j] += softirq_stat;
    			sum_softirq += softirq_stat;
    		}
    	}
    	t_total = (user + nice + system + idle + iowait + irq + softirq + steal) - t_total0;
    	t_total0 = user + nice + system + idle + iowait + irq + softirq + steal;
    	t_idle = idle + iowait;
    	t_usage = (t_total - t_idle) - t_usage0;
    	t_usage0 = t_total - t_idle;
    	cpu_usage = ((t_usage * 100) / t_total) / 10000000000;
    	seq_printf(m, "{\n\"TotalRam\":\"%d\",\n\"UsedRam\":\"%ld\",\n\"RamPercentage\":\"%ld\",\n\"CpuPercentage\":\"%lld\"\n}\n", total_ram, (available - info.bufferram), ram_usage, cpu_usage);
    	return 0;
    }
    static ssize_t my_proc_write(struct file *file, const char __user *buffer, size_t count, loff_t *f_pos)
    {
    	return 0;
    }
    static int my_proc_open(struct inode *inode, struct file *file)
    {
    	return single_open(file, my_proc_show, NULL);
    }
    static struct file_operations my_fops = {
    	.owner = THIS_MODULE,
    	.open = my_proc_open,
    	.release = single_release,
    	.read = seq_read,
    	.llseek = seq_lseek,
    	.write = my_proc_write};
    static int __init stats_init(void)
    {
    	struct proc_dir_entry *entry;
    	entry = proc_create("stats", 0777, NULL, &my_fops);
    	printk(KERN_INFO "“Buenas, att: 3, monitor de memoria\n");
    	if (!entry)
    	{
    		return -1;
    	}
    	return 0;
    }
    static void __exit stats_exit(void)
    {
    	printk(KERN_INFO "Bai, att: 3 y este fue el monitor de memoria\n");
    	remove_proc_entry("stats", NULL);
    }
    module_init(stats_init);
    module_exit(stats_exit);
    MODULE_LICENSE("GPL");

## Administrador de procesos

El modulo de kernel process genera un archivo ubicado en la direccion /proc/ap_grupo3 que contiene la información relacionada a los procesos del que se estan ejecutando en un momento en el tiempo.
![Ejemplo respuesta JSON](json_process.png)

#### Codigo modulo Administrador de procesos

    #include <linux/proc_fs.h>
    #include <linux/seq_file.h>
    #include <asm/uaccess.h>
    #include <linux/hugetlb.h>
    #include <linux/module.h>
    #include <linux/kernel.h>	/* Needed for KERN_INFO */
    #include <linux/init.h>		/* Needed for the macros */
    #include <linux/sched.h>    // informacion de procesos
    #include <linux/sched/signal.h> //para recorrido de procesos
    //#include < linux/fs.h>

    #define BUFSIZE 150

    MODULE_DESCRIPTION("Lista de los procesos dentro del sistema");
    MODULE_AUTHOR("Sistemas Operativos 2 - Diciembre 2020 - Grupo 3");
    MODULE_LICENSE("GPL");

    struct task_struct *task;//info de un proceso
    struct task_struct *task_child;        /*    Structure needed to iterate through task children    */
    struct list_head *list;            /*    Structure needed to iterate through the list in each task->children struct    */

    static int escribir_archivo(struct seq_file * archivo,void *v){
        u64 utime, stime, usage;
        utime = 0;
        stime = 0;
        usage = 0;
        seq_printf(archivo,"{ \"procesos\":[\n");
         for_each_process( task ){
             seq_printf(archivo,",\n");
             /*    for_each_process() MACRO for iterating through each task in the os located in linux\sched\signal.h    */
            stime += task->stime;
            utime += task->utime;
            usage = stime+utime;
            seq_printf(archivo, "{\"user\": %u , \"pid\": %d , \"nombre\": \"%s\" , \"estado\": %ld, \"usage\": %lld }\n",task->cred->uid.val, task->pid, task->comm, task->state, usage);/*    log parent id/executable name/state    */
        }
        seq_printf(archivo,"]}\n");
        return 0;
    }

    static int al_abrir(struct inode *inode, struct file *file){
        return single_open(file, escribir_archivo,NULL);
    }

    static struct file_operations operaciones =
    {
        .open = al_abrir,
        .read = seq_read
    };

    static int __init iniciar(void){
        proc_create("ap_grupo3",0,NULL,&operaciones);
        printk(KERN_INFO "Buenas att: grupo 3 Administrador de procesos\n");
        return 0;
    }

    static void __exit salir(void){
        remove_proc_entry("ap_grupo3",NULL);
        printk(KERN_INFO "Bai att grupo 3, este fue el modulo de administracion de procesos \n");
    }

    module_init(iniciar);
    module_exit(salir);

#### Task_Struct

Para poder planificar procesos, tenemos que saber qué es un "proceso". En todo sistema operativo un proceso está representado por una estructura de datos donde se guarda toda la información relevante de éste, el PCB (Process Control Block).
En Linux, cada proceso del sistema tiene dos estructuras que lo identifican: el PCB que es una estructura del tipo struct task_struct y una estructura del tipo struct thread_info.
![Tabla de procesos](task_struct.png)
