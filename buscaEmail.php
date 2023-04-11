<?PHP
include '../acessobdphp/cnxabre.php';
include '../funcoes.php';

$idUsu = (isset($_POST["id"])) ? $_POST["id"] : '';
$email = (isset($_POST["email"])) ? $_POST["email"] : '';
$idEsc = (isset($_POST["idEsc"])) ? $_POST["idEsc"] : '';

function retornaErro($msg) {
    echo json_encode([ "erro" => 1, "msg" => $msg ]);
    die();
}

if (strlen($idUsu) == 0 || strlen($email) == 0) {
    retornaErro('Dados incompletos, por favor informe novamente.');
}
$emailValido = $cnx->campoBD("0", "SELECT usu_email.id_email FROM usu_email 
   WHERE usu_email.id_usu = ? AND usu_email.email LIKE ?", [ $idUsu, $email]);
   
if ($emailValido == "0") {
    retornaErro('Dados não cadastrados. Por favor confira.');
} else {
    // envia o e-mail comm a senha e informa ao usuário
    $resp = 3961952; // usuário do sistema KAITS para os processos de matrícula online
    header("Location:../func/email_monta.php?idTipoEmail=1&idEsc=$idEsc&acao=envia&id=$idUsu&resp=$resp");
}

?>