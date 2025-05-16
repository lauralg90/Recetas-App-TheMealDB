'use strict'

function mensajeError(textoMensaje) {
    const mensajeError = document.createElement("p");
    mensajeError.textContent = textoMensaje;
    mensajeError.classList.add("aviso");
    return mensajeError;
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
            let mensaje = mensajeError("Cannot load categories. Reload the page or try again later.");
            if(select){
                select.insertAdjacentElement("afterend", mensaje);
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
                    // Evento boton-card  -----------------------------------------------------------------------------
                    // MODAL RECETA
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
                            let mensaje = mensajeError("The recipe cannot be displayed. Please, reload and try again.");
                            contenidoModal.appendChild(mensaje);
                            console.error(error.message);
                        })
                    });
                    // Evento boton-card  -----------------------------------------------------------------------------
                });
            })
            // Error al cargar recetas de la categoría (grid resultados)
            .catch(error => {
                let mensaje = mensajeError("No results can be displayed for this category. Please, reload the page and try again.");
                select.insertAdjacentElement("afterend", mensaje);
                console.error(error.message);
            });
        });
    }
    // Evento select (seleccionar categoría)


   
    

    



});
// DOMContentLoaded