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
