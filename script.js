'use strict'

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
                select.appendChild(option);
            });
            // console.log(datosCategorias);
        })
        .catch(error => {
            const mensajeError = document.createElement("p");
            mensajeError.textContent = "No se pudieron cargar las categorías. Inténtalo más tarde.";
            mensajeError.classList.add("aviso");
            resultados.innerHTML = "";
            select.insertAdjacentElement("afterend", mensajeError);

            console.error(error.message);
        });


    // Resultados de categoría seleccionada ---------------------------------------------------------------------------

    // Si la opción es "All recipes" (por defecto) mostrar recetas más populares
    if(select.value === ""){

    }

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
                    boton.classList.add("boton");
                    boton.textContent = "Ver más";
                    divInfo.appendChild(boton);
                    // Col Bootstrap
                    let col = document.createElement("div");
                    col.classList.add("col-md-6");
                    col.classList.add("col-lg-4");
                    col.appendChild(cardReceta);
                    resultados.appendChild(col);
                });
            })
            .catch(error => console.error(error.message));
    });



});
// DOMContentLoaded