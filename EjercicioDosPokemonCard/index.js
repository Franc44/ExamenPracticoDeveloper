//Variable del cache de las busquedas en la api
const pokemonCache = {};

// BUSQUEDA DE POKEMON
async function searchPokemon() {
    const input = document.getElementById('searchInput');
    const query = input.value.toLowerCase().trim();

    //Validar busqueda no vacia
    if (!validateQuery(query)) return;

    hideError();
    setLoading(true);

    try{
        let pokemon;
        
        //Verificamos en cache si esta el pokemon
        if (pokemonCache[query]){
            pokemon = pokemonCache[query];
        }else {
            //Se realiza la peticion ya que no esta en cache
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

            if(!response.ok){
                throw new Error('Pokémon no encontrado');
            }

            pokemon = await response.json();

            //Guarda en cache el resultado
            pokemonCache[query] = pokemon;
        }


        //Mostrar datos
        displayPokemon(pokemon);
        setLoading(false);

    }catch (error){
        setLoading(false);
        showError('❌ ' + error.message + '. Intenta con otro nombre o ID.');
    }
}

//VALIDACIONES
function validateQuery(query) {
    if (query.trim() === '') {
        showError('Por favor ingresa un nombre o ID de Pokémon');
        return false;
    }

    return true;
}

//MANEJO DE ERRORES
function showError(message) {
    const errorDiv = document.getElementById('errorAlert');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    document.getElementById('cardContainer').classList.add('d-none');
}

function hideError() {
    document.getElementById('errorAlert').classList.add('d-none');
}

//LOADING
function setLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    if (isLoading) {
        loadingDiv.classList.remove('d-none');
    } else {
        loadingDiv.classList.add('d-none');
    }
}


//MOSTRAR DATOS 
function displayPokemon(pokemon){
    // Datos principales
    document.getElementById('pokemonId').textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
    document.getElementById('pokemonName').textContent = pokemon.name;
    document.getElementById('pokemonImage').src = pokemon.sprites.front_default || 'https://via.placeholder.com/200';

    // Tipos
    const typesContainer = document.getElementById('pokemonTypes');
    typesContainer.innerHTML = pokemon.types
                                      .map(t => `<div class="btn btn-outline-light" disabled>${t.type.name}</div>`)
                                      .join('');

    // Estadísticas
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = pokemon.stats
        .map(stat => `
            <div class="col-6">
                <div class="stat-box">
                    <div class="stat-name">${stat.stat.name}</div>
                    <div class="stat-value">${stat.base_stat}</div>
                </div>
            </div>
        `)
        .join('');

    // Mostrar card
    document.getElementById('cardContainer').classList.remove('d-none');
}