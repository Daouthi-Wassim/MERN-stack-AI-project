const mongoose = require('mongoose');
const Notification = require('../models/notificationSchema');
const Seller = require('../models/sellerSchema');
const Admin = require('../models/adminSchema');
const Customer = require('../models/customerSchema');
const nodemailer = require('nodemailer');

class NotificationService {
    static async create(notificationData, options = {}) {
        const session = options.session || await mongoose.startSession();
        let notification;

        try {

            // 2. Création de la notification
            notification = new Notification({
                ...notificationData,
                status: 'En attente'
            });

            // 3. Sauvegarde transactionnelle
            if (options.session) {
                await notification.save({ session });
            } else {
                await notification.save();
            }

            // 4. Envoi des notifications externes
            if (notification.channel.includes('EMAIL')) {
                await this.sendEmailNotification(notification);
            }

            // 5. Mise à jour du statut
            notification.status = 'Envoyée';
            await notification.save();

            return notification;

        } catch (error) {
            if (notification) {
                notification.status = 'Échec';
                await notification.save();
            }
            throw error;
        } finally {
            if (!options.session) {
                session.endSession();
            }
        }
    }

    static validateNotificationData(data) {
        const requiredFields = ['destinataire', 'modeleDestinataire', 'type', 'contenu'];
        requiredFields.forEach(field => {
            if (!data[field]) {
                throw new Error(`Champ requis manquant: ${field}`);
            }
        });
    }

    static async sendEmailNotification(notification) {
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD
                }
            });

            const recipient = await this.getRecipientInfo(
                notification.destinataire,
                notification.modeleDestinataire
            );

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: recipient.email,
                subject: notification.contenu.titre,
                text: notification.contenu.message,
                html: this.generateEmailTemplate(notification)
            };

            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Erreur envoi email:', error);
            throw error;
        }
    }

    static async getRecipientInfo(recipientId, modelType) {
        let model;
        switch (modelType) {
            case 'Customer':
                model = Customer;
                break;
            case 'Seller':
                model = Seller;
                break;
            case 'Admin':
                model = Admin;
                break;
            default:
                throw new Error('Type de destinataire invalide');
        }

        const recipient = await model.findById(recipientId).select('email');
        if (!recipient) throw new Error('Destinataire introuvable');
        return recipient;
    }

    static generateEmailTemplate(notification) {
            const { metadata } = notification.contenu;
            switch (notification.type) {
                case 'PAIEMENT_REUSSI':
                case 'CREDIT_SOLDE ':
                case 'COMMISSION':
                    return `
           <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a;">
    <header style="background: rgb(82, 5, 106); padding: 20px; text-align: center; border-bottom: 3px solid #6a1b9a;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
           <img src='' alt="Shoppingi Logo" style="max-width: 200px; height: auto;">
            <h1 style="color: white; margin: 0; font-family: 'Arial Rounded MT Bold', sans-serif; letter-spacing: 2px;">
                SHOPPINGI
            </h1>
        </div>
    </header>

    <main style="padding: 30px 20px; color: white;">
        <h2 style="margin-bottom: 25px; border-left: 4px solidrgb(248, 246, 249); padding-left: 15px;">
            ${notification.contenu.titre}
        </h2>
        <h3 style="margin-bottom: 25px; border-left: 4px solidrgb(4, 234, 69); padding-left: 15px;">
            ${notification.contenu.message}
        </h3>
        <div style="background: rgb(96, 91, 91); border-radius: 8px; padding: 20px; backdrop-filter: blur(5px);">
            ${metadata?.items ? `
            <h3 style="color:rgb(248, 248, 248); margin-top: 0;">Détails de la commande :</h3>
            <table style="width: 100%; border-collapse: collapse;">
                ${metadata.items.map(item => `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 10px; color: #e0e0e0;">${item.name}</td>
                    <td style="padding: 10px; text-align: right; color: #e0e0e0;">${item.quantity}x</td>
                   
                </tr>
                `).join('')}
            </table>
            ` : ''}

            <div style="margin-top: 20px; background: rgba(255, 254, 254, 0.1); padding: 15px; border-radius: 6px;">
                ${metadata?.orderId ? `
                <p style="margin: 10px 0;">
                    <i class="fas fa-receipt" style="margin-right: 8px; color: #6a1b9a;"></i>
                    <strong>Transaction ID:</strong> 
                    <span style="color:rgb(246, 241, 241);">${metadata.orderId}</span>
                </p>
                ` : ''}

                ${metadata?.totalAmount ? `
                <p style="margin: 10px 0;">
                    <i class="fas fa-wallet" style="margin-right: 8px; color: #00c853;"></i>
                    <strong>Total:</strong> 
                    <span style="color: #00c853; font-weight: 600;">${metadata.totalAmount}$</span>
                </p>
                ` : ''}

            </div>
        </div>

        <p style="margin-top: 30px; color: #a8a8a8; text-align: center;">
            Thank you for your confidence 
        </p>
    </main>

    <footer style="background: rgb(82, 5, 106); padding: 20px; text-align: center; color: #d0d0d0; font-size: 0.9em;">
      
        <p style="margin: 5px 0;">
            © ${new Date().getFullYear()} Shoppingi 
            <span style="color: #6a1b9a;">•</span> 
            Tous droits réservés
        </p>
    </footer>
</div>
        `;
        case "RETURN_REQUEST":
            return `
                   <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a;">
                    <header style="background: rgb(82, 5, 106); padding: 20px; text-align: center; border-bottom: 3px solid #6a1b9a;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <img src='' alt="Shoppingi Logo" style="max-width: 200px; height: auto;">
                            <h1 style="color: white; margin: 0; font-family: 'Arial Rounded MT Bold', sans-serif; letter-spacing: 2px;">
                                SHOPPINGI
                            </h1>
                        </div>
                    </header>
                    <h2 style="margin-bottom: 25px; border-left: 4px solidrgb(248, 246, 249); padding-left: 15px;">
            ${notification.contenu.titre}
        </h2>
       
                    <div style="padding: 20px;">
                        <p><strong>Type:</strong> ${notification.contenu.message.split('|')[0]}</p>
                        <p><strong>Montant:</strong> ${metadata.amount}</p>
                        <a href="${process.env.SELLER_DASHBOARD_URL}/returns/${metadata.returnId}" 
                           style="background: #6a1b9a; color: white; padding: 10px 15px; text-decoration: none;">
                            Traiter la demande
                        </a>
                    </div>
                                <footer style="background: rgb(82, 5, 106); padding: 20px; text-align: center; color: #d0d0d0; font-size: 0.9em;">
                    
                        <p style="margin: 5px 0;">
                            © ${new Date().getFullYear()} Shoppingi 
                            <span style="color: #6a1b9a;">•</span> 
                            Tous droits réservés
                        </p>
                    </footer>
                </div>
                    `;
        
        case "RETURN_APPROVED":
            return `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a;">
                <header style="background: rgb(82, 5, 106); padding: 20px; text-align: center; border-bottom: 3px solid #6a1b9a;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                    <img src='' alt="Shoppingi Logo" style="max-width: 200px; height: auto;">
                        <h1 style="color: white; margin: 0; font-family: 'Arial Rounded MT Bold', sans-serif; letter-spacing: 2px;">
                            SHOPPINGI
                        </h1>
                    </div>
                </header>
                     <h2 style="margin-bottom: 25px; border-left: 4px solidrgb(248, 246, 249); padding-left: 15px;">
            ${notification.contenu.titre}
        </h2>
                    ${metadata.type === "exchange" ? `
                        <p>Préparez-vous à recevoir votre nouvel article</p>
                    ` : `
                        <p>Montant remboursé: ${metadata.amount}€</p>
                        <p>Date: ${new Date(metadata.date).toLocaleDateString()}</p>
                    `}
                    <footer style="background: rgb(82, 5, 106); padding: 20px; text-align: center; color: #d0d0d0; font-size: 0.9em;">
      
                    <p style="margin: 5px 0;">
                        © ${new Date().getFullYear()} Shoppingi 
                        <span style="color: #6a1b9a;">•</span> 
                        Tous droits réservés
                    </p>
                </footer>
            </div>
            `;
            
        case "RETURN_REJECTED":
            return `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a;">
                    <header style="background: rgb(82, 5, 106); padding: 20px; text-align: center; border-bottom: 3px solid #6a1b9a;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <img src='' alt="Shoppingi Logo" style="max-width: 200px; height: auto;">
                            <h1 style="color: white; margin: 0; font-family: 'Arial Rounded MT Bold', sans-serif; letter-spacing: 2px;">
                                SHOPPINGI
                            </h1>
                        </div>
                    </header>
                        <h2 style="margin-bottom: 25px; border-left: 4px solidrgb(248, 246, 249); padding-left: 15px;">
                ${notification.contenu.titre}
            </h2>
                    <h2>Demande de retour refusée</h2>
                    <p>Raison: ${metadata.reason || "Non spécifiée"}</p>
                    <a href="${process.env.SUPPORT_URL}">Contacter le support</a>
                </div>
            `;
            case "RETURN_REJECTED":
            return `
                <div style="...">
                    <h2>Demande de retour refusée</h2>
                    <p>Raison: ${metadata.reason || "Non spécifiée"}</p>
                    <a href="${process.env.SUPPORT_URL}">Contacter le support</a>
                 <footer style="background: rgb(82, 5, 106); padding: 20px; text-align: center; color: #d0d0d0; font-size: 0.9em;">
      
                    <p style="margin: 5px 0;">
                        © ${new Date().getFullYear()} Shoppingi 
                        <span style="color: #6a1b9a;">•</span> 
                        Tous droits réservés
                    </p>
                </footer>
            </div>
            `;
            case "ORDER_CANCELLED":
            case"ORDER_DELIVERED":
                return `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a;">
    <header style="background: rgb(82, 5, 106); padding: 20px; text-align: center; border-bottom: 3px solid #6a1b9a;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <img src="" alt="Shoppingi Logo" style="max-width: 200px; height: auto;">
            <h1 style="color: white; margin: 0; font-family: 'Arial Rounded MT Bold', sans-serif; letter-spacing: 2px;">
                SHOPPINGI
            </h1>
        </div>
    </header>

    <main style="padding: 30px 20px; color: white;">
        <h2 style="margin-bottom: 25px; border-left: 4px solid rgb(248, 246, 249); padding-left: 15px;">
            ${notification.contenu.titre}
        </h2>
        <h3 style="margin-bottom: 25px; border-left: 4px solid rgb(4, 234, 69); padding-left: 15px;">
            ${notification.contenu.message}
        </h3>
        <div style="background: rgb(96, 91, 91); border-radius: 8px; padding: 20px; backdrop-filter: blur(5px);">
            ${metadata?.items ? `
            <h3 style="color: rgb(248, 248, 248); margin-top: 0;">Order Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                ${metadata.items.map(item => `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 10px; color: #e0e0e0;">${item.name}</td>
                    <td style="padding: 10px; text-align: right; color: #e0e0e0;">${item.quantity}x</td>
                </tr>
                `).join('')}
            </table>
            ` : ''}

            <div style="margin-top: 20px; background: rgba(255, 254, 254, 0.1); padding: 15px; border-radius: 6px;">
                ${metadata?.orderId ? `
                <p style="margin: 10px 0;">
                    <i class="fas fa-receipt" style="margin-right: 8px; color: #6a1b9a;"></i>
                    <strong>Transaction ID:</strong> 
                    <span style="color: rgb(246, 241, 241);">${metadata.orderId}</span>
                </p>
                ` : ''}

                ${metadata?.totalAmount ? `
                <p style="margin: 10px 0;">
                    <i class="fas fa-wallet" style="margin-right: 8px; color: #00c853;"></i>
                    <strong>Total:</strong> 
                    <span style="color: #00c853; font-weight: 600;">${metadata.totalAmount}$</span>
                </p>
                ` : ''}
            </div>
        </div>

        <p style="margin-top: 30px; color: #a8a8a8; text-align: center;">
            Thank you for your trust in us!
        </p>
    </main>

    <footer style="background: rgb(82, 5, 106); padding: 20px; text-align: center; color: #d0d0d0; font-size: 0.9em;">
        <p style="margin: 5px 0;">
            © ${new Date().getFullYear()} Shoppingi 
            <span style="color: #6a1b9a;">•</span> 
            All rights reserved
        </p>
    </footer>
</div>
`;
case 'NEW_REVIEW':
    return `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a;">
    <header style="background: rgb(82, 5, 106); padding: 20px; text-align: center; border-bottom: 3px solid #6a1b9a;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
            <img src='' alt="Shoppingi Logo" style="max-width: 200px; height: auto;">
            <h1 style="color: white; margin: 0; font-family: 'Arial Rounded MT Bold', sans-serif; letter-spacing: 2px;">
                SHOPPINGI
            </h1>
        </div>
    </header>

    <main style="padding: 30px 20px; color: white;">
        <h2 style="margin-bottom: 25px; border-left: 4px solid rgb(248, 246, 249); padding-left: 15px;">
            ${notification.contenu.titre}
        </h2>
        
        <div style="background: rgb(96, 91, 91); border-radius: 8px; padding: 20px; backdrop-filter: blur(5px);">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                <div style="font-size: 2em; color: #FFD700;">
                    ${'★'.repeat(metadata.rating)}${'☆'.repeat(5 - metadata.rating)}
                </div>
                <div>
                    <h3 style="margin: 0; color: #fff;">${metadata.productName}</h3>
                    <p style="margin: 5px 0; color: #ccc;">Review ID: ${metadata.reviewId}</p>
                </div>
            </div>

            ${metadata.comment ? `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px;">
                <p style="margin: 0; font-style: italic; color: #e0e0e0;">
                    "${metadata.comment}"
                </p>
            </div>
            ` : ''}

            <div style="margin-top: 20px; background: rgba(255, 254, 254, 0.1); padding: 15px; border-radius: 6px;">
                <p style="margin: 10px 0;">
                    <i class="fas fa-user" style="margin-right: 8px; color: #6a1b9a;"></i>
                    <strong>Client:</strong> 
                    <span style="color:rgb(246, 241, 241);">${metadata.customerName}</span>
                </p>
                
                
                </p>
            </div>
        </div>

        
    </main>

    <footer style="background: rgb(82, 5, 106); padding: 20px; text-align: center; color: #d0d0d0; font-size: 0.9em;">
        <p style="margin: 5px 0;">
            © ${new Date().getFullYear()} Shoppingi 
            <span style="color: #6a1b9a;">•</span> 
            Tous droits réservés
        </p>
    </footer>
</div>
    `;
    }
    }
}

module.exports = NotificationService;