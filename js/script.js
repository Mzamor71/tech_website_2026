// Smooth scrolling

document.querySelectorAll('a').forEach(anchor => {

    anchor.addEventListener('click', function(e){

        const href = this.getAttribute('href');

        if(href.startsWith('#')){

            e.preventDefault();

            document.querySelector(href).scrollIntoView({
                behavior:'smooth'
            });

        }

    });

});

console.log("Website Loaded");