'use strict'

// Funciones de mensajes para el usuario  ------------------------------------------------------------------------------

function mensaje(textoMensaje) {
    const aviso = document.createElement("p");
    aviso.textContent = textoMensaje;
    aviso.classList.add("aviso");
    return aviso;
}

function eliminarMensajeAnterior() {
    let mensajeAnterior = document.querySelector(".aviso");
    if (mensajeAnterior) {
        mensajeAnterior.remove();
    }
}

// Funciones de tarjetas  ---------------------------------------------------------------------------------------------

function crearCardReceta(urlImagen, nombreReceta, ubicacion) {
    // Card
    let cardReceta = document.createElement("article");
    cardReceta.classList.add("card-receta");
    // Imagen
    let figure = document.createElement("figure");
    let img = document.createElement("img");
    img.setAttribute("src", urlImagen);
    figure.appendChild(img);
    cardReceta.appendChild(figure);
    // Div info
    let divInfo = document.createElement("div");
    cardReceta.appendChild(divInfo);
    // Título
    let titulo = document.createElement("h3");
    titulo.textContent = nombreReceta;
    divInfo.appendChild(titulo);
    // Col Bootstrap
    let col = document.createElement("div");
    col.classList.add("col-md-6");
    col.classList.add("col-lg-4");
    col.appendChild(cardReceta);
    if (ubicacion) {
        ubicacion.appendChild(col);
    }

    return { cardReceta, divInfo };
}

function botonAbrirModal(textoBoton, ubicacion) {
    let boton = document.createElement("a");
    boton.classList.add("boton-modal");
    boton.classList.add("boton-guardar");
    boton.textContent = textoBoton;
    boton.setAttribute("href", "#");
    // Clases de Bootstrap para abrir la modal
    boton.setAttribute("data-bs-toggle", "modal");
    boton.setAttribute("data-bs-target", "#modalReceta");
    ubicacion.appendChild(boton);

    return boton;
}

function datosModalReceta(idReceta) {
    const modalTitulo = document.querySelector(".modal-title");
    const listaIngredientes = document.querySelector(".modal-body ul");
    const instrucciones = document.querySelector(".modal-body p");
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
            instrucciones.innerHTML = "";
            let arrayReceta = datosReceta.meals;
            arrayReceta.forEach(datos => {

                modalTitulo.textContent = datos.strMeal;

                // Ingredientes (las recetas de la API siempre tienen 20 propiedades de ingredientes, pero no todas tiene un valor)
                for (let i = 1; i <= 20; i++) {
                    let ingrediente = datos[`strIngredient${i}`];
                    let cantidad = datos[`strMeasure${i}`];
                    if (ingrediente !== "") {
                        let item = document.createElement("li");
                        item.textContent = `${cantidad} ${ingrediente}`;
                        listaIngredientes.appendChild(item);
                    }
                }

                instrucciones.textContent = datos.strInstructions;
                
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
}

// Funciones de gestión de favoritos  ---------------------------------------------------------------------------------

function guardarFavorito(idReceta) {
    let favoritos ;
    // Obtener favoritos del localStorage, si no existen se crea un array  
    if (localStorage.getItem("favoritos")) {
        favoritos = JSON.parse(localStorage.getItem("favoritos"));
    } else {
        favoritos = [];
    }

    // Añadir la receta al array si todavía no existe en él
    if (!favoritos.includes(idReceta)) {
        favoritos.push(idReceta);
    }

    // Guardar array actualizado en localStorage (convertir array a string porque LocalStorage sólo guarda string
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
}

function borrarFavorito(idReceta) {
    let favoritos = JSON.parse(localStorage.getItem("favoritos"));

    // Filtrar las recetas que no se corresponden con la receta a eliminar
    favoritos = favoritos.filter(id => id !== idReceta);
    
    // Guardar array actualizado en localStorage
    localStorage.setItem("favoritos", JSON.stringify(favoritos));

    return favoritos;
}

function comprobarSiEsFavorito(idReceta) {
    // Asegurar que favoritos siempre es un array, aunque esté vacío para evitar errores null
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    return favoritos.includes(idReceta);
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
            if (select) {
                select.appendChild(option);
            }
        });
        // console.log(datosCategorias);
    })
    // Error al cargar las categorías
    .catch(error => {
        // Evitar errores de consola en otras páginas donde no existe el elemento
        if (resultados) {
            resultados.innerHTML = "";
        }
        eliminarMensajeAnterior();
        let mensajeError = mensaje("Cannot load categories. Reload the page or try again later.");
        if (select) {
            select.insertAdjacentElement("afterend", mensajeError);
        }
        console.error(error.message);
    });

    // Resultados de categoría seleccionada ---------------------------------------------------------------------------

    // El código sólo se ejecuta si el elemento existe en el DOM (para evitar que la consola muestre errores en páginas donde este elemento no existe)
    if (select) {
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

                    let { divInfo } = crearCardReceta(receta.strMealThumb, receta.strMeal, resultados);
                    
                    let boton = botonAbrirModal("View recipe", divInfo);

                    // Guardar id de la receta en el botón de su card
                    // Al crear tarjetas dinámicamente, cada una tiene su propio botón "View recipe". Este botón está asociado a una receta concreta, por lo que tenemos que asociarlo a su id. Cada botón lleva consigo los datos que necesita gracias a DATASET (guarda datos personalizados en un elemento HTML)
                    boton.dataset.idReceta = receta.idMeal;

                    // MODAL ============================================================================================
                    boton.addEventListener("click", () => {
                        const idReceta = boton.dataset.idReceta;
                        
                        datosModalReceta(idReceta);

                        // GUARDAR/BORRAR FAVORITO  ----------------------------------------------------------------------
                        // Mensaje para el usuario al guardar o borrar receta
                        const mensajeFavoritos = document.querySelector(".modal-footer .mensajeFavoritos");

                        const botonGuardar = document.querySelector("button.boton-guardar");
                        const botonBorrar = document.querySelector("button.boton-borrar");

                        // Mostrar sólo botón guardar o borrar dependiendo de si la receta ya se guardó en favoritos
                        if(comprobarSiEsFavorito(idReceta) === true){
                            botonGuardar.style.display = "none";
                            botonBorrar.style.display = "inline-block";
                        }else{
                            botonGuardar.style.display = "inline-block";
                            botonBorrar.style.display = "none";
                        }

                        botonGuardar.addEventListener("click", () => {
                            guardarFavorito(idReceta);
                            eliminarMensajeAnterior();
                            let mensajeRecetaGuardada = mensaje("Recipe successfully saved!");
                            mensajeFavoritos.innerHTML = "";
                            mensajeFavoritos.appendChild(mensajeRecetaGuardada);
                            // El mensaje se queda por defecto en las siguientes modales que se abren, así que lo elimino pasados 2 segundos para que no se muestre en la siguiente modal, no he encontrado otra forma de hacerlo que funcionase
                            setTimeout(() => {
                                if (mensajeRecetaGuardada) {
                                    mensajeRecetaGuardada.textContent = "";
                                }
                            }, 2000);
                            botonGuardar.style.display = "none";
                            botonBorrar.style.display = "inline-block";

                        });

                        botonBorrar.addEventListener("click", () => {
                            borrarFavorito(idReceta);
                            eliminarMensajeAnterior();
                            let mensajeRecetaBorrada = mensaje("Recipe successfully removed!");
                            mensajeFavoritos.innerHTML = "";
                            mensajeFavoritos.appendChild(mensajeRecetaBorrada);
                            setTimeout(() => {
                                if (mensajeRecetaBorrada) {
                                    mensajeRecetaBorrada.textContent = "";
                                }
                            }, 2000);
                            botonGuardar.style.display = "inline-block";
                            botonBorrar.style.display = "none";
                        });

                    });
                    // MODAL ============================================================================================
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

    if (favoritos === null) {
        eliminarMensajeAnterior();
        let mensajeError = mensaje("Your list of highlighted recipes is empty.");
        mensajeError.style.textAlign = "center";
        if(gridFavoritos){
            gridFavoritos.insertAdjacentElement("afterend", mensajeError);
        }  
    }else{
        if(gridFavoritos){
            gridFavoritos.innerHTML = "";
        }
        favoritos.forEach(idReceta => {
            fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idReceta}`)
            .then(respuesta => {
                if (!respuesta.ok) {
                    throw new Error("Error en la petición HTTP: " + respuesta.status);
                } else {
                    return respuesta.json();
                }
            })
            .then(datosReceta => {
                let receta = datosReceta.meals;
                receta.forEach(datos => {
                    let { divInfo } = crearCardReceta(datos.strMealThumb, datos.strMeal, gridFavoritos);

                    let botonVerReceta = botonAbrirModal("View recipe", divInfo);

                    botonVerReceta.addEventListener("click", () => {
                        datosModalReceta(datos.idMeal);
                    });

                    let botonEliminar = document.createElement("button");
                    botonEliminar.classList.add("boton-modal");
                    botonEliminar.classList.add("boton-borrar");
                    botonEliminar.textContent = "Delete from favourites";
                    botonEliminar.style.margin = 0;
                    botonEliminar.style.marginBottom = "16px";
                    divInfo.appendChild(botonEliminar);

                    botonEliminar.addEventListener("click", () => {
                        borrarFavorito(datos.idMeal);
                        // Borrar elemento del DOM
                        botonEliminar.parentElement.parentElement.parentElement.remove();
                    });
                });
            })
            // Error al cargar grid de favoritos
            .catch(error => {
                eliminarMensajeAnterior();
                let mensajeError = mensaje("Error loading your highlights recipes. Please reload the page and try again.");
                gridFavoritos.insertAdjacentElement("afterend", mensajeError);
                console.error(error.message);
            })
        });
    }

});
// DOMContentLoaded