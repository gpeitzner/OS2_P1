package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

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

	type proceso struct {
		Padre int64 `json:"padre"`
		User int64 `json:"user"`
		Pid int64 `json:"pid"`
		Nombre string `json:"nombre"`
		Estado int64 `json:"estado"`
		Usage int64 `json:"usage"`
	}

	type Procesos struct {
		Proceso []proceso `json:"procesos"`
	}

	jsonFile, err := os.Open("/proc/ap_grupo3")

	if err != nil {
		fmt.Println(err)
	}

	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	byteValue = []byte(strings.Replace(string(byteValue),",\n]}","\n]}",1))

	var p Procesos

	json.Unmarshal(byteValue, &p)

	json.NewEncoder(w).Encode(p)

}

func Stats(w http.ResponseWriter, req *http.Request) {

	type stats struct {
		TotalRam string
		UsedRam string
		RamPercentage string
		CpuPercentage string
	}

	jsonFile, err := os.Open("/proc/m_grupo3")

	if err != nil {
		fmt.Println(err)
	}

	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var s stats

	json.Unmarshal(byteValue, &s)

	json.NewEncoder(w).Encode(s)

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

	router.HandleFunc("/stats", Stats).Methods("GET")

	router.HandleFunc("/matarproceso/{pid}", Matar).Methods("GET")

	fmt.Printf("http://localhost/procesos")

	log.Fatal(http.ListenAndServe(":80",router))
}
