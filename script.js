'use strict'

document.addEventListener("DOMContentLoaded", () => {

const select = document.querySelector("select[name='categorias']");
const resultados = document.querySelector("div.grid-resultados");

fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
.then(respuesta => {
    if(!respuesta.ok){
        throw new Error ("Error en la petición HTTP: " + respuesta.status);
    }else{
        return respuesta.json();
    }
})
.then(categorias => {
    const arrayCategorias = categorias.categories;
    arrayCategorias.forEach(categoria => {
        // let categoriaNombre = categoria.strCategory;
        // console.log(categoriaNombre);

        let option = document.createElement("option");
        option.textContent = categoria.strCategory;
        option.setAttribute("value", categoria.idCategory);
        select.appendChild(option);
    });
})
.catch(error => {
    const mensajeError = document.createElement("p");
    mensajeError.textContent = "No se pudieron cargar las categorías. Inténtalo más tarde.";
    mensajeError.classList.add("aviso");
});




});
// DOMContentLoaded