<?php
/*
Template Name: Documentation
Description: A template for embedding the documentation site
*/

get_header(); ?>

<style>
.docs-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 100px); /* Adjust for your header height */
    overflow: hidden;
}

.docs-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
}

.docs-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: inherit;
    color: #666;
    z-index: 1;
}
</style>

<div class="docs-container">
    <div class="docs-loading" id="docs-loading">
        Loading documentation...
    </div>
    <iframe 
        class="docs-iframe"
        src="https://docs.promptreviews.app/" 
        onload="document.getElementById('docs-loading').style.display='none'"
        title="Prompt Reviews Documentation">
    </iframe>
</div>

<script>
// Handle iframe navigation
window.addEventListener('message', function(event) {
    if (event.origin !== 'https://docs.promptreviews.app') return;
    
    // Handle any communication from the docs site
    console.log('Message from docs site:', event.data);
});
</script>

<?php get_footer(); ?>
