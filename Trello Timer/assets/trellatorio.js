//key:"8f1e3c5a0a3a1bc758f8a6f7c53f836a"
//secret:"66c2de679608c3d3bd93730315966ca67fb1c00e45b2835f4dce2b46361463be"

if (window.location.href.indexOf("https://trello.com/logged-out") == 0 ) {
    Trello.deauthorize();
};

function initTrellatorioOnChrome() {

    $('#trellatorio').remove();
    $('.trellatorio-block-click').remove();
    $('.trellatorio-edit-popup').remove();

    var html = '<div class="window-module clearfix" id="trellatorio" data-card="' + getCardId() + '"">';
    html += '<div class="clearfix"><h3>Timer</h3><span class="trellatorio-timer">';
    html += '<span class="timer-hours">00</span>:';
    html += '<span class="timer-minutes">00</span>:';
    html += '<span class="timer-seconds">00</span>';
    html += '</span></div><div class="clearfix">';
    html += '<div class="login-box"><p>Você precisa <a href="#" class="autorizar-trellatorio">autorizar</a> o acesso do <strong>Trello Timer</strong> para utilizar essa ferramenta.</p></div>';
    html += '<div class="nao-autorizado">'
    html += '<a href="#" class="button-link js-start-timer" title="Clique para iniciar a contagem de tempo."> <span class="icon-sm icon-clock"></span> Começar</a>';
    html += '<a href="#" class="button-link js-send-timer" title="Clique para salvar a contagem de tempo."> <span class="icon-sm icon-save"></span> Salvar</a>';
    html += '<p class="quiet bottom"><a href="#" class="quiet-button js-edit-timer" title="Clique para editar quanto tempo você trabalhou nessa atividade.">Editar suas horas</a></p>';
    html += '</div></div></div>';

    $('.card-detail-window .window-sidebar').prepend(html);

    html = '<div class="trellatorio-block-click"></div>';
    html += '<div class="pop-over trellatorio-edit-popup clearfix"><div class="header clearfix"><span class="header-title">Editar Horas</span><a class="close-btn js-close-popover" href="#"><span class="icon-sm icon-close"></span></a></div>';
    html += '<div class="content clearfix fancy-scrollbar js-tab-parent" style="max-height: 311px;"><div><form id="editForm" class="edit-timer" action name="editForm" >';
    html += '<input type="number" name="horas" form="editForm" min="0" placeholder="00" class="timer-horas">';
    html += ':';
    html += '<input type="number" name="minutos" form="editForm" min="0" max="59" placeholder="00" class="timer-minutos">';
    html += ':';
    html += '<input type="number" name="segundos" form="editForm" min="0" max="59" placeholder="00" class="timer-segundos">';
    html += '<input type="submit" value="Salvar" class="btn-send-edit"></form>';
    html += '</div></div></div>';

    $('body').append(html);

    if (typeof(clockIsRunning) != "undefined") {
        if (clockIsRunning) {
            clearInterval(intervalo);
        }
    }

    isSavingHours = false;
    isEditingHours = false;
    clockIsRunning = false;
    windowModuleRemoved = false;

    // Verifica se o usuário tem acesso ao Trello
    Trello.authorize({
        interactive: false,
        success: autorizado,
        error: naoAutorizado
    });

    $('.trellatorio-timer').removeClass('running-clock');

    // Adiciona os listeners do Trellatório Timer
    $('#trellatorio').on('click', '.js-start-timer', function(event) {
        event.preventDefault();
        trellatorioStartTimer();
    });

    $('#trellatorio').on('click', '.js-stop-timer', function(event) {
        event.preventDefault();
        trellatorioPararTimer();
    });

    $('#trellatorio').on('click', '.js-send-timer', function(event) {
        event.preventDefault();
        if (isSavingHours) {
            alerta('Aguarde um pouco para salvar');
        } else {
            var h = parseInt( $('#trellatorio .timer-hours').text() );
            var m = parseInt( $('#trellatorio .timer-minutes').text() );
            var s = parseInt( $('#trellatorio .timer-seconds').text() );
            var i = getCardId();
            trellatorioAtualizarTimer(h, m, s, i);
        }
    });

    $('#trellatorio').on('click', '.js-edit-timer', function(event) {
        event.preventDefault();
        if (isEditingHours) {
            alerta('Aguarde um pouco para editar');
        } else {
            trellatorioEditTimer();
        }
    });

    // Adiciona o listener do loggin
    $('#trellatorio').on('click', '.autorizar-trellatorio', function(event) {
        event.preventDefault();
        logar();
    });

    // Adiciona o listenet para fechar do pop-up
    $('.trellatorio-edit-popup').on('click', '.js-close-popover', function(event) {
        event.preventDefault();
        unblockSaveAndEdit();
        $('.trellatorio-edit-popup').stop().fadeOut('slow');
        $('.trellatorio-block-click').stop().hide();
    });

    // Adiciona o listenet para fechar do pop-up clicando fora dele
    $('.trellatorio-block-click').on('click', function(event) {
        event.preventDefault();
        unblockSaveAndEdit();
        $('.trellatorio-edit-popup').stop().fadeOut('slow');
        $('.trellatorio-block-click').stop().hide();
    });

    // Adiciona o listenet para o salvar do pop-up
    $('.trellatorio-edit-popup form').submit(function(event) {
        var h = $('#editForm input.timer-horas').val();
        var m = $('#editForm input.timer-minutos').val();
        var s = $('#editForm input.timer-segundos').val();
        console.log(h+"/"+m+"/"+s);
        trellatorioAtualizarHorasEditadas(h, m, s);
        event.preventDefault();
    });

    window.onbeforeunload = function() { return null }
    
    // Adiciona um listener para fechar o card
    document.addEventListener("DOMNodeRemoved", function(event){
        //console.log(event);
        if (event.relatedNode.className == "window-module" && !windowModuleRemoved) {
            windowModuleRemoved = true;

            var h = parseInt( $('#trellatorio .timer-hours').text() );
            var m = parseInt( $('#trellatorio .timer-minutes').text() );
            var s = parseInt( $('#trellatorio .timer-seconds').text() );
            var i = $('#trellatorio').attr('data-card');

            if (clockIsRunning || h != 0 || m != 0 || s != 0) {
                clearInterval(intervalo);
                clockIsRunning = false;

                var confirmarSaida = confirm("Deseja guardar o tempo antes de sair?\n\n(escolher 'Cancelar' perderá o processo)");
                if (confirmarSaida){                    
                    trellatorioAtualizarTimer(h, m, s, i);
                }
            }
        }
    });

}

function autoplay() {
    chrome.storage.sync.get({
        autoplay: false,
    }, function(items) {
        if (items.autoplay == true) {
            $('#trellatorio .js-start-timer').trigger( "click" );
        }
    });
}

function logar() {
    Trello.authorize({
        type: 'popup',
        name: 'Trello Timer', 
        persist: true,
        expiration: 'never',
        success: autorizado,
        error: naoAutorizado,
        scope: { write: true, read: true }
    });
}

function alerta(mensagem) {
    var html = '<div class="trello-toast"><p>';
    html += mensagem;
    html += '</p></div>';

    $('body').append(html);
    $('.trello-toast').fadeIn('fast');

    setTimeout(function(){
        $('.trello-toast').stop().fadeOut('slow', function() {
            $(this).remove();
        });
    }, 2000);
}

function blockSaveAndEdit() {
    $('.js-send-timer').addClass('blocked').attr('title', 'Salvando informações.');
    $('.js-edit-timer').addClass('blocked').attr('title', 'Salvando informações.');
    isSavingHours = true;
    isEditingHours = true;
}

function unblockSaveAndEdit() {
    $('.js-send-timer').removeClass('blocked').attr('title', 'Clique para salvar a contagem de tempo.');
    $('.js-edit-timer').removeClass('blocked').attr('title', 'Clique para salvar a contagem de tempo.');
    isSavingHours = false;
    isEditingHours = false;
}

function isDuasCasas(num) {

    if (num <= 0) {
        return "00";
    } else if (num < 10) {
        num = "0"+ num.toString();
        return num;
    } else {
        return num;
    }
    
}

function toSegundos(tempo) {
    tempo = tempo.toString();
    tempo = tempo.trim();

    if (tempo.indexOf(":") > 0) {
        tempo = tempo.split(":");

        if (tempo.length == 3) {
            var h = parseInt( tempo[0].trim() );
            var m = parseInt( tempo[1].trim() );
            var s = parseInt( tempo[2].trim() );

            var segundos = (3600 * h) + (60 * m) + s;

        return segundos;
        }
    }

    return 0;
}

function toHoras(tempo) {
    tempo = parseInt(tempo);

    var s = tempo % 60;
    tempo = Math.floor( tempo / 60 );

    var m = tempo % 60;
    var h = Math.floor( tempo / 60 );

    return isDuasCasas(h) + ":" + isDuasCasas(m) + ":" + isDuasCasas(s);
}

function zerarRelogio() {
    $('#trellatorio .timer-hours').text('00');
    $('#trellatorio .timer-minutes').text('00');
    $('#trellatorio .timer-seconds').text('00');
    window.onbeforeunload = function() { return null }
}

function timeWizard() {
    var horas = parseInt( $('#trellatorio .timer-hours').text() );
    var minutos = parseInt( $('#trellatorio .timer-minutes').text() );
    var segundos = parseInt( $('#trellatorio .timer-seconds').text() );

    segundos++;
    
    if (segundos == 60) {
        minutos ++;
        segundos = 0;
    }

    if (minutos == 60) {
        horas ++;
        minutos = 0;

        horas = isDuasCasas(horas);
        $('#trellatorio .timer-hours').text(horas);
    }

    minutos = isDuasCasas(minutos);
    segundos = isDuasCasas(segundos);
    $('#trellatorio .timer-minutes').text(minutos);
    $('#trellatorio .timer-seconds').text(segundos);
}

function trellatorioStartTimer() {
    // 1sec = 1000ms
    var tempo = 1000;
    alerta('Contagem iniciada');
    intervalo = setInterval("timeWizard();", tempo);
    clockIsRunning = true;
    window.onbeforeunload = function() { return 'Você possui horas em aberto.' }
    $('.trellatorio-timer').addClass('running-clock');
    $('.js-start-timer').addClass('js-stop-timer').removeClass('js-start-timer').html('<span class="icon-sm icon-clock"></span> Parar');
}

function trellatorioPararTimer() {
    clearInterval(intervalo);
    clockIsRunning = false;
    $('.trellatorio-timer').removeClass('running-clock');
    $('.js-stop-timer').addClass('js-start-timer').removeClass('js-stop-timer').html('<span class="icon-sm icon-clock"></span> Começar');
}

function trellatorioEditTimer() {
    var id = getCardId();
    if (id != false) {
        blockSaveAndEdit();
        Trello.members.get("me", function(me) {
            lerHoras(id, me.fullName, me.username);
        }, function(){
            alerta('Ops. Houve um erro: verifique se você está autorizado a usar essa ferramenta.');
            unblockSaveAndEdit();
        });
    } else {
        alerta('Ops. Houve um erro: verifique se você está autorizado a usar essa ferramenta.');
    }
}

function trellatorioAtualizarTimer(h, m, s, id) {
    var horasEmSegundos = toSegundos(h + ":" + m + ":" + s);

    if (clockIsRunning) {
        alerta('Pare o relógio antes de salvar os dados.');
    } else {
        if (horasEmSegundos == 0) {
            alerta('Você não trabalhou nenhuma hora.');
        } else {
            blockSaveAndEdit();
            Trello.members.get("me", function(me) {
                adicionarHoras(id, me.fullName, me.username, horasEmSegundos);
            }, function() {
                unblockSaveAndEdit();
                alerta('Ops... Houve um erro.');
            } );
        }
    }
}

function autorizado() {
    $('#trellatorio .login-box').stop().hide();
    $('.nao-autorizado').addClass('autorizado');
    autoplay();
}

function naoAutorizado() {
    $('#trellatorio .login-box').stop().show();
    $('.nao-autorizado').removeClass('autorizado');
    console.log('Putz... Não foi autorizado.');
}

function getCardId() {
    var url = window.location.href;
    if ( url.indexOf('/c/') > 0 ) {
        var id = url.split("/c/");
        id = id[1].split("/");
        return id[0];
    } else {
        return false;
    }
}

function adicionarHoras(id, nome, username, horasEmSegundos) {
    if (id != false) {
        Trello.cards.get( id + "/checklists", function(checklists) {
            if (checklists.length == 0) {
                var msgHoras = nome + " (@" + username + ") - " + toHoras(horasEmSegundos);
                criarHoras(id, msgHoras);
            } else {
                var checklistAtual = false;
                $.each(checklists, function(index, checklist) {
                    if ( checklist.name == "Horas" ) { checklistAtual = checklist }
                });

                if ( checklistAtual != false ) {
                    Trello.checklists.get( checklistAtual.id , function(checklist){
                        if (checklist.checkItems.length == 0) {
                            var msgHoras = nome + " (@" + username + ") - " + toHoras(horasEmSegundos);
                            
                            Trello.post("cards/" + id + "/checklist/" + checklist.id + "/checkItem", { name: msgHoras }, function() {
                                unblockSaveAndEdit();
                                zerarRelogio();
                                alerta('Horas adicionadas com sucesso.');
                            }, function() {
                                unblockSaveAndEdit();
                            });
                        } else {
                            $.each(checklist.checkItems, function(index, item) {
                                if ( item.name.indexOf("(@" + username + ") - ") > 0 ) {
                                    var txt = item.name.split("(@" + username + ") - ");
                                    var tempo = toSegundos(txt[1].trim());
                                    tempo = tempo + horasEmSegundos;

                                    var msgHoras = nome + " (@" + username + ") - " + toHoras(tempo);

                                    Trello.post("cards/" + id + "/checklist/" + checklist.id + "/checkItem", { name: msgHoras, pos: item.pos }, function() {
                                        Trello.delete("checklists/" + checklist.id + "/checkItems/" + item.id, function(){
                                            unblockSaveAndEdit();
                                            zerarRelogio();
                                            alerta('Horas adicionadas com sucesso.');
                                        }, function() {
                                            alerta('Ops... Houve um erro ao atualizar as horas, verifique se há algo duplicado.');
                                            unblockSaveAndEdit();
                                        });
                                    }, function() {
                                        unblockSaveAndEdit();
                                    });
                                }
                            });
                        }
                    }, function() {
                        unblockSaveAndEdit();
                    });
                } else {
                    var msgHoras = nome + " (@" + username + ") - " + toHoras(horasEmSegundos);
                    criarHoras(id, msgHoras);
                }
            }
        }, function() {
            unblockSaveAndEdit();
        });
    } else {
        unblockSaveAndEdit();
        alerta('Ops. Houve um erro: verifique se você está autorizado a usar essa ferramenta.');
    }
}

function atualizarHoras(id, nome, username, horasEmSegundos) {
    if (id != false) {
        Trello.cards.get( id + "/checklists", function(checklists) {
            if (checklists.length == 0) {
                var msgHoras = nome + " (@" + username + ") - " + toHoras(horasEmSegundos);
                criarHoras(id, msgHoras);
            } else {
                var checklistAtual = false;
                $.each(checklists, function(index, checklist) {
                    if ( checklist.name == "Horas" ) { checklistAtual = checklist }
                });

                if ( checklistAtual != false ) {
                    Trello.checklists.get( checklistAtual.id , function(checklist){
                        if (checklist.checkItems.length == 0) {
                            var msgHoras = nome + " (@" + username + ") - " + toHoras(horasEmSegundos);
                            
                            Trello.post("cards/" + id + "/checklist/" + checklist.id + "/checkItem", { name: msgHoras }, function() {
                                unblockSaveAndEdit();
                                zerarRelogio();
                                alerta('Horas alteradas com sucesso.');
                            }, function() {
                                unblockSaveAndEdit();
                            });
                        } else {
                            $.each(checklist.checkItems, function(index, item) {
                                if ( item.name.indexOf("(@" + username + ") - ") > 0 ) {
                                    var msgHoras = nome + " (@" + username + ") - " + toHoras(horasEmSegundos);

                                    Trello.post("cards/" + id + "/checklist/" + checklist.id + "/checkItem", { name: msgHoras, pos: item.pos }, function() {
                                        Trello.delete("checklists/" + checklist.id + "/checkItems/" + item.id, function(){
                                            unblockSaveAndEdit();
                                            zerarRelogio();
                                            alerta('Horas alteradas com sucesso.');
                                        }, function() {
                                            alerta('Ops... Houve um erro ao atualizar as horas, verifique se há algo duplicado.');
                                            unblockSaveAndEdit();
                                        });
                                    }, function() {
                                        unblockSaveAndEdit();
                                    });
                                }
                            });
                        }
                    }, function() {
                        unblockSaveAndEdit();
                    });
                } else {
                    var msgHoras = nome + " (@" + username + ") - " + toHoras(horasEmSegundos);
                    criarHoras(id, msgHoras);
                }
            }
        }, function() {
            unblockSaveAndEdit();
        });
    } else {
        unblockSaveAndEdit();
        alerta('Ops. Houve um erro: verifique se você está autorizado a usar essa ferramenta.');
    }
}

function criarHoras(id, msgHoras) {
    Trello.post( "cards/" + id + "/checklists", { name: 'Horas' }, function(checklist) {
        Trello.post("cards/" + id + "/checklist/" + checklist.id + "/checkItem", { name: msgHoras }, function() {
            unblockSaveAndEdit();
            zerarRelogio();
            alerta('Horas adicionadas com sucesso.');
        }, function() {
            unblockSaveAndEdit();
        });
    }, function() {
        unblockSaveAndEdit();
    });
}

function lerHoras(id, nome, username) {
    var hora = "00";
    var minutos = "00";
    var segundos = "00";

    Trello.cards.get( id + "/checklists", function(checklists) {
        if (checklists.length == 0) {
            createElementEditHours(id, nome, username, hora, minutos, segundos);
        } else {
            $.each(checklists, function(index, checklist) {
                if (checklist.name == 'Horas') {
                    Trello.checklists.get( checklist.id , function(checklist) {
                        $.each(checklist.checkItems, function(index, item) {
                            if ( item.name.indexOf(nome + " (@" + username + ") - ") == 0) {
                                var txt = item.name.split(nome + " (@" + username + ") - ");
                                var txt = txt[1].trim().split(":");
                                hora = txt[0].trim();
                                minutos = txt[1].trim();
                                segundos = txt[2].trim();
                                createElementEditHours(id, nome, username, hora, minutos, segundos);
                            } else {
                                createElementEditHours(id, nome, username, hora, minutos, segundos);
                            }
                        });
                    }, function() {
                        alerta('Ops.. houve um erro.');
                        unblockSaveAndEdit();
                    });
                } else {
                    createElementEditHours(id, nome, username, hora, minutos, segundos);
                }
            });
        }
    }, function(){
        alerta('Ops... Houve um erro lendo esse card. Tente novamente.');
        unblockSaveAndEdit();
    });
}

function createElementEditHours(id, nome, username, hora, minutos, segundos) {

    $('.trellatorio-edit-popup').attr({
        'data-id': id,
        'data-nome': nome,
        'data-username': username
    });

    $('.trellatorio-edit-popup').css({
        top: $('#trellatorio').offset().top,
        left: $('#trellatorio').offset().left
    }).fadeIn('fast');

    $('.trellatorio-block-click').show();

    $('.trellatorio-edit-popup .header-title').text('Clique para editar as horas');
    $('#editForm .timer-horas').val(hora.toString().trim());
    $('#editForm .timer-minutos').val(minutos.toString().trim());
    $('#editForm .timer-segundos').val(segundos.toString().trim());

}

function trellatorioAtualizarHorasEditadas(hora, minutos, segundos) {
    var id = $('.trellatorio-edit-popup').attr('data-id');
    var nome = $('.trellatorio-edit-popup').attr('data-nome');
    var username = $('.trellatorio-edit-popup').attr('data-username');

    var horasEmSegundos = toSegundos(hora + ":" + minutos + ":" + segundos);

    atualizarHoras(id, nome, username, horasEmSegundos);
    $('.trellatorio-edit-popup').stop().fadeOut('slow');
    $('.trellatorio-block-click').stop().hide();
}

// Creating Listeners in Mutation Observer (isso salva vidas, cara) :D

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
var list = document.querySelector('html');

var observer = new MutationObserver(function(mutations) {  
    mutations.forEach(function(mutation) {
        // Apenas eventos de aumento de nós
        if (mutation.type === 'childList' && mutation.addedNodes.length != 0 && mutation.removedNodes.length == 0 ) {
            if (mutation.target.className == 'window-wrapper clearfix js-tab-parent' && mutation.addedNodes[0].className == 'card-detail-window clearfix') {
                initTrellatorioOnChrome();
            }
        }
    });
});

observer.observe(list, {
    childList: true, 
    characterData: true,
    subtree: true
});