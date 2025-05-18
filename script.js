'use strict'

// Funciones de mensajes para el usuario  ------------------------------------------------------------------------------

function mensaje(textoMensaje) {
    const aviso = document.createElement("p");
    aviso.textContent = textoMensaje;
    aviso.classList.add("aviso");
    return aviso; 
}

function eliminarMensajeAnterior() {
    // Eliminar un mensaje anterior si existe
    let mensajeAnterior = document.querySelector(".aviso");
    if(mensajeAnterior){
        mensajeAnterior.remove();
    }
}

// Funciones de gestión de favoritos  ---------------------------------------------------------------------------------

// localStorage.getItem("favoritos"); para ver datos almacenados
// localStorage.removeItem("favoritos"); para limpiar datos almacenados

let favoritos ;

function guardarFavorito(idReceta) {
    
    // Obtener favoritos del localStorage, si no existen se crea un array  
    if(localStorage.getItem("favoritos")){
        favoritos = JSON.parse(localStorage.getItem("favoritos"));
    }else{
        favoritos = [];
    }

    // Añadir la receta al array si todavía no existe en él
    if(!favoritos.includes(idReceta)){
        favoritos.push(idReceta);
    }

    // Guardar array actualizado en LocalStorage (convertir array a string porque LocalStorage sólo guarda string
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function borrarFavorito(idReceta) {

}


document.addEventListener("DOMContentLoaded", () => {

    // Variable global para almacenar datos de categorías que necesitaré
    let datosCategorias = {};

    const select = document.querySelector("select[name='categorias']");
    const resultados = document.querySelector("div.grid-resultados");

    // Categorías del select  -----------------------------------------------------------------------------------------

    fetch("https://www.themealdb.com/api/json/v1/1/categories.php")
        .then(respuesta => {
            if (!respuesta.ok) {
                throw new Error("Error en la petición HTTP: " + respuesta.status);
            } else {
                return respuesta.json();
            }
        })
        .then(categorias => {
            const arrayCategorias = categorias.categories;
            arrayCategorias.forEach(categoria => {
                // let categoriaNombre = categoria.strCategory;
                // console.log(categoriaNombre);

                // Guardar id y nombre en el objeto
                datosCategorias[categoria.idCategory] = categoria.strCategory;

                let option = document.createElement("option");
                option.textContent = categoria.strCategory;
                option.setAttribute("value", categoria.idCategory);
                // Evitar errores de consola en otras páginas donde no existe el elemento
                if(select){
                    select.appendChild(option);
                }
            });
            // console.log(datosCategorias);
        })
        // Error al cargar las categorías
        .catch(error => {
            // Evitar errores de consola en otras páginas donde no existe el elemento
            if(resultados){
                resultados.innerHTML = "";
            }
            eliminarMensajeAnterior();
            let mensajeError = mensaje("Cannot load categories. Reload the page or try again later.");
            if(select){
                select.insertAdjacentElement("afterend", mensajeError);
            }
            console.error(error.message);
        });


    // Resultados de categoría seleccionada ---------------------------------------------------------------------------

    // El código sólo se ejecuta si el elemento existe en el DOM (para evitar que la consola muestre errores en páginas donde este elemento no existe)
    if(select) {
        select.addEventListener("change", () => {
            // Limpiar grid
            resultados.innerHTML = "";

            // Petición de recetas y creación de cards (el filtro por categorías de la API sólo admite nombre, no id)
            // Pasamos el id de la categoría (value del option) como clave del objeto datosCategoria, para que nos devuelva el valor de la clave
            let idCategoria = select.value;
            let nombreCategoria = datosCategorias[idCategoria];

            fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${nombreCategoria}`)
            .then(respuesta => {
                if (!respuesta.ok) {
                    throw new Error("Error en la petición HTTP: " + respuesta.status);
                } else {
                    return respuesta.json();
                }
            })
            .then(categoria => {
                const arrayRecetas = categoria.meals;
                arrayRecetas.forEach(receta => {
                    // Card
                    let cardReceta = document.createElement("article");
                    cardReceta.classList.add("card-receta");
                    // Imagen
                    let figure = document.createElement("figure");
                    let img = document.createElement("img");
                    img.setAttribute("src", receta.strMealThumb);
                    figure.appendChild(img);
                    cardReceta.appendChild(figure);
                    // Div info
                    let divInfo = document.createElement("div");
                    cardReceta.appendChild(divInfo);
                    // Título
                    let titulo = document.createElement("h3");
                    titulo.textContent = receta.strMeal;
                    divInfo.appendChild(titulo);
                    // Botón
                    let boton = document.createElement("a");
                    boton.classList.add("boton-card");
                    boton.textContent = "View recipe";
                    boton.setAttribute("href", "#");
                    // Clases de Bootstrap para abrir la modal
                    boton.setAttribute("data-bs-toggle", "modal");
                    boton.setAttribute("data-bs-target", "#modalReceta");
                    divInfo.appendChild(boton);
                    // Col Bootstrap
                    let col = document.createElement("div");
                    col.classList.add("col-md-6");
                    col.classList.add("col-lg-4");
                    col.appendChild(cardReceta);
                    resultados.appendChild(col);

                    // Guardar id de la receta en el botón de su card
                    // Al crear tarjetas dinámicamente, cada una tiene su propio botón "View recipe". Este botón está asociado a una receta concreta, por lo que tenemos que asociarlo a su id. Cada botón lleva consigo los datos que necesita gracias a DATASET (guarda datos personalizados en un elemento HTML)
                    boton.dataset.idReceta = receta.idMeal;
                    
                    // MODAL RECETA =====================================================================================
                    
                    // Botón card - apertura modal
                    boton.addEventListener("click", () => {
                        const idReceta = boton.dataset.idReceta;
                        const modalTitulo = document.querySelector(".modal-title");
                        const listaIngredientes = document.querySelector(".modal-body ul");
                        const listaPasos = document.querySelector(".modal-body ol");
                        
                        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idReceta}`)
                        .then(respuesta => {
                            if (!respuesta.ok) {
                                throw new Error("Error en la petición HTTP: " + respuesta.status);
                            } else {
                                return respuesta.json();
                            }
                        })
                        .then(datosReceta => {
                            // Limpiar los datos mostrados en otra petición anterior (si no limpiamos y clicamos dos veces sobre la misma card, aparecen duplicados)
                            listaIngredientes.innerHTML = "";
                            listaPasos.innerHTML = "";

                            let arrayReceta = datosReceta.meals;
                            arrayReceta.forEach(datos => {
                                // Datos modal receta
                                modalTitulo.textContent = datos.strMeal;
                                // Ingredientes (las recetas de la API siempre tienen 20 propiedades de ingredientes, pero no todas tiene un valor)
                                for(let i = 1; i <= 20; i++){
                                    let ingrediente = datos[`strIngredient${i}`];
                                    let cantidad = datos[`strMeasure${i}`];                                       
                                    if(ingrediente !== ""){
                                        let item = document.createElement("li");
                                        item.textContent = `${cantidad} ${ingrediente}`;
                                        listaIngredientes.appendChild(item);
                                    }
                                }
                                // Pasos (la API los muestra en un único párrafo, lo transformo en un array para mostrarlo en una lista ordenada)
                                let pasos = datos.strInstructions;
                                if(pasos.includes(".")){
                                    let arrayPasos = pasos.split(".");
                                    arrayPasos.splice(-1, 1);
                                    for(let i = 0; i < arrayPasos.length; i++){
                                        let item = document.createElement("li");
                                        item.textContent = arrayPasos[i] + ".";
                                        listaPasos.appendChild(item);
                                    }
                                }else{
                                    let item = document.createElement("li");
                                    item.textContent = datos.strInstructions + ".";
                                    listaPasos.appendChild(item);
                                }
                            });
                        })
                        // Error al cargar la receta (modal)
                        .catch(error => {
                            const contenidoModal = document.querySelector(".modal-content");
                            contenidoModal.innerHTML = "";
                            eliminarMensajeAnterior();
                            let mensajeError = mensaje("The recipe cannot be displayed. Please, reload and try again.");
                            contenidoModal.appendChild(mensajeError);
                            console.error(error.message);
                        })

                        // GUARDAR/BORRAR FAVORITO  ----------------------------------------------------------------------
                        // Mensaje para el usuario al guardar o borrar receta
                        const mensajeFavoritos = document.querySelector(".modal-footer .mensajeFavoritos");
                        
                        const botonGuardar = document.querySelector(".boton-guardar");
                        botonGuardar.addEventListener("click", () => {
                            guardarFavorito(idReceta);
                            eliminarMensajeAnterior();
                            let mensajeRecetaGuardada = mensaje("Recipe successfully saved!");
                            mensajeFavoritos.innerHTML = "";
                            mensajeFavoritos.appendChild(mensajeRecetaGuardada);
                        });

                    });
                    // MODAL RECETA =====================================================================================
                });
            })
            // Error al cargar recetas de la categoría (grid resultados)
            .catch(error => {
                eliminarMensajeAnterior();
                let mensajeError = mensaje("No results can be displayed for this category. Please, reload the page and try again.");
                select.insertAdjacentElement("afterend", mensajeError);
                console.error(error.message);
            });
        });
    }
    // Evento select (seleccionar categoría)


    // MOSTRAR FAVORITOS ------------------------------------------------------------------------------------------------

    const gridFavoritos = document.querySelector(".grid-favoritos");
    
    let favoritos = JSON.parse(localStorage.getItem("favoritos"));
    console.log("Favoritos:");
    console.log(favoritos);

    if(favoritos.length > 0){
        favoritos.forEach(idReceta => {
            fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idReceta}`)
            .then(respuesta => {
                if(!respuesta.ok){
                    throw new Error ("Error en la petición HTTP: " + respuesta.status);
                }else{
                    return respuesta.json();
                }
            })
            .then(datosReceta => {
                let receta = datosReceta.meals;
                receta.forEach(datos => {
                    // Card
                    let cardReceta = document.createElement("article");
                    cardReceta.classList.add("card-receta");
                    // Imagen
                    let figure = document.createElement("figure");
                    let img = document.createElement("img");
                    img.setAttribute("src", datos.strMealThumb);
                    figure.appendChild(img);
                    cardReceta.appendChild(figure);
                    // Div info
                    let divInfo = document.createElement("div");
                    cardReceta.appendChild(divInfo);
                    // Título
                    let titulo = document.createElement("h3");
                    titulo.textContent = datos.strMeal;
                    divInfo.appendChild(titulo);
                    // Botón Ver Receta
                    let botonVerReceta = document.createElement("a");
                    botonVerReceta.classList.add("boton-modal");
                    botonVerReceta.classList.add("boton-guardar");
                    botonVerReceta.textContent = "View recipe";
                    botonVerReceta.setAttribute("href", "#");
                    // Clases de Bootstrap para abrir la modal
                    botonVerReceta.setAttribute("data-bs-toggle", "modal");
                    botonVerReceta.setAttribute("data-bs-target", "#modalReceta");
                    divInfo.appendChild(botonVerReceta);
                    // Boton Emliminar de favoritos
                    let botonEliminar = document.createElement("button");
                    botonEliminar.classList.add("boton-modal");
                    botonEliminar.classList.add("boton-borrar");
                    botonEliminar.textContent = "Delete from favourites";
                    botonEliminar.style.margin = 0;
                    botonEliminar.style.marginBottom = "16px";
                    divInfo.appendChild(botonEliminar);
                    // Col Bootstrap
                    let col = document.createElement("div");
                    col.classList.add("col-md-6");
                    col.classList.add("col-lg-4");
                    col.appendChild(cardReceta);
                    if(gridFavoritos){
                        gridFavoritos.appendChild(col);
                    } 
                });
                
            })
        })   
    }

});
// DOMContentLoaded