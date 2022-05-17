export default function Card({url}) {
    return (
        <div class="w-full rounded">
            <img src={url}
                alt="image" loading="lazy"></img>
        </div>
    )
}