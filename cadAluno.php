<?PHP

function semEscola() {
    return "<div id='areaCadastro' class='semEscola'><h4>Este processo de matrícula online não está disponível.</h4></div>";
}

function intro($nomeEsc) {
    $html = "<div id='intro'>
        <h4>Bem-vindo ao processo de matrícula online da escola:</h4>
        <h2>$nomeEsc</h2>
    </div>";
    return $html;
}

function pedeCPF() {
    $html = "<div id='areaCadastro'></div>";
    return $html;
}

function editaCadasto() {
    

    $html = "<div id='areaEditaCadastro'></div>";
    return $html;
}

?>

