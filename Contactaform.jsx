import { useState } from "react";

export default function Contactaform() {
    const [result, setResult] = useState("");

    const onSumbit = async (event) => {
        event.preventDefault();
       setResult("Sending...");
       const formData = new FormData(event.target);
         formData.append("access_key", "01ecad6d-4137-4c25-97a1-c45e507b7df8");

         const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
         });

            const data = await response.json();
            if (data.success) {
                setResult("Form Submitted Successfully");
                event.target.reset();
            } else {
                setResult("Error: ");
            }
    };

    return (
        <form onSubmit={onSumbit}>
            <input type="text" name="name" placeholder="Your Name" required />
            <input type="email" name="email" placeholder="Your Email" required />
            <textarea name="message" placeholder="Your Message" required></textarea>
            <button type="submit">Submit Form</button>
            <span>{result}</span>
        </form>
    );
}