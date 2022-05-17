export default function Card({ url, name, rank }) {
    return (
        <div className="flex flex-col text-center m-2">
            #{name} - {rank}
            <div class="w-full rounded">
                <img src={url}
                    alt="image" loading="lazy"></img>
            </div>
        </div>
    )
}