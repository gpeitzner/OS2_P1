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
        seq_printf(archivo, "{\"user\": %u , \"pid\": %d , \"nombre\": \"%s\" , \"estado\": %ld, \"usage\": %ld }\n",task->cred->uid.val, task->pid, task->comm, task->state, usage);/*    log parent id/executable name/state    */
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